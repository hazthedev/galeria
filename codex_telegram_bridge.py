import os
import asyncio
import subprocess
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
ALLOWED_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")  # string

if not BOT_TOKEN or not ALLOWED_CHAT_ID:
    raise SystemExit(
        "Missing env vars. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.\n"
        "PowerShell example:\n"
        "$env:TELEGRAM_BOT_TOKEN='123:abc'\n"
        "$env:TELEGRAM_CHAT_ID='123456789'\n"
    )

MAX_TELEGRAM_LEN = 3500  # keep safe under Telegram limit


def run_codex(prompt: str) -> str:
    """
    Runs Codex CLI with the given prompt and returns stdout+stderr text.
    """
    cmd = ["codex", prompt]

    p = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=60 * 20,  # 20 minutes
    )
    return p.stdout


def clip(text: str) -> str:
    if len(text) <= MAX_TELEGRAM_LEN:
        return text
    return text[:MAX_TELEGRAM_LEN] + "\n\n...(truncated)"


async def ensure_allowed(update: Update) -> bool:
    chat_id = str(update.effective_chat.id)
    return chat_id == str(ALLOWED_CHAT_ID)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await ensure_allowed(update):
        return
    await update.message.reply_text(
        "Connected.\n\n"
        "Send:\n"
        " /codex <prompt>\n"
        "Example:\n"
        "/codex Refactor my Laravel controller into a service + validation rules."
    )


async def codex_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await ensure_allowed(update):
        return

    prompt = " ".join(context.args).strip()
    if not prompt:
        await update.message.reply_text("Usage: /codex <prompt>")
        return

    await update.message.reply_text("Running Codex...")

    try:
        output = await asyncio.to_thread(run_codex, prompt)
        await update.message.reply_text("Done.\n\n" + clip(output))
    except subprocess.TimeoutExpired:
        await update.message.reply_text(
            "Codex timed out. Try a smaller prompt or increase timeout."
        )
    except FileNotFoundError:
        await update.message.reply_text(
            "'codex' command not found on this machine. Check your install/path."
        )
    except Exception as e:
        await update.message.reply_text(f"Error: {e}")


async def plain_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Optional: treat any normal message as a Codex prompt.
    Enable if you want to just type prompt without /codex.
    """
    if not await ensure_allowed(update):
        return

    prompt = (update.message.text or "").strip()
    if not prompt:
        return

    await update.message.reply_text("Running Codex... (send /codex for explicit mode)")

    try:
        output = await asyncio.to_thread(run_codex, prompt)
        await update.message.reply_text("Done.\n\n" + clip(output))
    except Exception as e:
        await update.message.reply_text(f"Error: {e}")


def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("codex", codex_cmd))

    # Uncomment if you want *any* message to trigger Codex:
    # app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, plain_text))

    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
