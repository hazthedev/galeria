param(
  [string]$BaseUrl = "https://galeria-neon.vercel.app",
  [string]$EventId = "dbf261a9-5530-47ba-aed8-dc824f27ea64",
  [int]$RequestsPerEndpoint = 15,
  [int]$DelayMs = 150,
  [int]$TimeoutSec = 30,
  [string]$Scope = "hazthedevs-projects",
  [string]$Project = "galeria",
  [string]$Since = "1h",
  [int]$LogLimit = 800,
  [switch]$SkipVercelLogs
)

function Get-Percentile([double[]]$values, [double]$p) {
  if (-not $values -or $values.Count -eq 0) {
    return 0
  }

  $sorted = $values | Sort-Object
  if ($sorted.Count -eq 1) {
    return [math]::Round($sorted[0], 2)
  }

  $rank = ($p / 100) * ($sorted.Count - 1)
  $lower = [math]::Floor($rank)
  $upper = [math]::Ceiling($rank)
  if ($lower -eq $upper) {
    return [math]::Round($sorted[$lower], 2)
  }

  $weight = $rank - $lower
  $value = $sorted[$lower] + ($sorted[$upper] - $sorted[$lower]) * $weight
  return [math]::Round($value, 2)
}

$targets = @(
  @{ name = "home"; url = "$BaseUrl/" },
  @{ name = "auth_login"; url = "$BaseUrl/auth/login" },
  @{ name = "guest_event_page"; url = "$BaseUrl/e/$EventId" },
  @{ name = "api_health"; url = "$BaseUrl/api/health" },
  @{ name = "api_event_stats"; url = "$BaseUrl/api/events/$EventId/stats" },
  @{ name = "api_lucky_draw_config"; url = "$BaseUrl/api/events/$EventId/lucky-draw/config" }
)

$results = @()

foreach ($target in $targets) {
  for ($i = 1; $i -le $RequestsPerEndpoint; $i++) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $status = -1

    try {
      $resp = Invoke-WebRequest `
        -Uri $target.url `
        -Method GET `
        -UseBasicParsing `
        -TimeoutSec $TimeoutSec `
        -MaximumRedirection 8 `
        -Headers @{ "Cache-Control" = "no-cache" }
      $status = [int]$resp.StatusCode
    } catch {
      if ($_.Exception.Response) {
        $status = [int]$_.Exception.Response.StatusCode
      }
    } finally {
      $sw.Stop()
    }

    $results += [pscustomobject]@{
      endpoint = $target.name
      url = $target.url
      run = $i
      status = $status
      ms = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)
    }

    Start-Sleep -Milliseconds $DelayMs
  }
}

$summary = $results |
  Group-Object endpoint |
  ForEach-Object {
    $rows = $_.Group
    $times = @($rows | ForEach-Object { [double]$_.ms })
    $first = $rows | Where-Object { $_.run -eq 1 } | Select-Object -First 1
    $statusGroups = $rows | Group-Object status | Sort-Object Name
    $statusText = ($statusGroups | ForEach-Object { "$($_.Name)x$($_.Count)" }) -join ", "

    [pscustomobject]@{
      endpoint = $_.Name
      first_ms = [math]::Round([double]$first.ms, 2)
      p50_ms = Get-Percentile $times 50
      p95_ms = Get-Percentile $times 95
      avg_ms = [math]::Round((($times | Measure-Object -Average).Average), 2)
      min_ms = [math]::Round((($times | Measure-Object -Minimum).Minimum), 2)
      max_ms = [math]::Round((($times | Measure-Object -Maximum).Maximum), 2)
      statuses = $statusText
    }
  } |
  Sort-Object endpoint

Write-Output ""
Write-Output "Synthetic latency baseline"
Write-Output ("Timestamp (UTC): {0}" -f (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss 'UTC'"))
Write-Output ("Base URL: {0}" -f $BaseUrl)
Write-Output ("Requests per endpoint: {0}" -f $RequestsPerEndpoint)
Write-Output ""
$summary | Format-Table -AutoSize

if (-not $SkipVercelLogs) {
  Write-Output ""
  Write-Output "Vercel runtime log snapshot"
  $raw = npx vercel logs --scope $Scope --project $Project --environment production --since $Since --no-follow --limit $LogLimit --json 2>&1
  $lines = $raw | Where-Object { $_ -match "^\{" }
  $entries = @()
  foreach ($line in $lines) {
    try {
      $entries += ($line | ConvertFrom-Json)
    } catch {
      # Ignore non-JSON lines
    }
  }

  if ($entries.Count -eq 0) {
    Write-Output "No JSON log entries available."
  } else {
    $status2xx = @($entries | Where-Object { $_.responseStatusCode -ge 200 -and $_.responseStatusCode -lt 300 }).Count
    $status4xx = @($entries | Where-Object { $_.responseStatusCode -ge 400 -and $_.responseStatusCode -lt 500 }).Count
    $status5xx = @($entries | Where-Object { $_.responseStatusCode -ge 500 }).Count
    $errorLevel = @($entries | Where-Object { $_.level -eq "error" -or $_.level -eq "fatal" }).Count

    Write-Output ("total_entries={0}" -f $entries.Count)
    Write-Output ("error_level_entries={0}" -f $errorLevel)
    Write-Output ("status_2xx={0}" -f $status2xx)
    Write-Output ("status_4xx={0}" -f $status4xx)
    Write-Output ("status_5xx={0}" -f $status5xx)

    Write-Output ""
    Write-Output "Top paths by volume:"
    $entries |
      Group-Object requestPath |
      Sort-Object Count -Descending |
      Select-Object -First 8 |
      ForEach-Object { "{0}`t{1}" -f $_.Count, $_.Name }
  }
}

