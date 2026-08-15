#!/usr/bin/env python3
"""
Script de debug para testar o fluxo de aceite do convite
Roda um servidor HTTP local e captura os logs do console
"""
import subprocess
import time
import os
import sys
from pathlib import Path

# Token de teste fornecido no briefing
TEST_TOKEN = "3acd9c047032d6b2294ea54c319bb6de9fd311684ab4f65d224b2f65"
TEST_EMAIL = "teste.onboarding@ruahtecnologia.com.br"

PROJECT_DIR = Path(__file__).parent

print("🔧 Iniciando setup de teste...")
print(f"📁 Diretório: {PROJECT_DIR}")
print(f"🎫 Token: {TEST_TOKEN[:20]}...")

# Mudar para o diretório do projeto
os.chdir(str(PROJECT_DIR))

print("\n🚀 Iniciando servidor HTTP na porta 8000...")

# Usar Python HTTP server
http_process = subprocess.Popen(
    [sys.executable, "-m", "http.server", "8000"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

time.sleep(2)

print("✅ Servidor rodando em http://localhost:8000")

# URL de teste (como viria do email)
test_url = f"http://localhost:8000/auth/confirm?token_hash={TEST_TOKEN}&type=invite"
print(f"\n📱 URL de teste: {test_url}")

# Tentar com Playwright
try:
    import asyncio
    from playwright.async_api import async_playwright

    async def debug_invite_flow():
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            context = await browser.new_context(
                # Desabilitar cache para simular "navegador limpo"
                ignore_https_errors=True
            )
            page = await context.new_page()

            # Capturar logs do console
            console_logs = []
            page.on("console", lambda msg: console_logs.append({
                "type": msg.type,
                "text": msg.text,
                "location": msg.location
            }))

            # Navegar para a URL
            print(f"\n🌐 Navegando para: {test_url}")
            await page.goto(test_url, wait_until="networkidle")

            # Aguardar um pouco para deixar o boot completar
            print("⏳ Aguardando boot da aplicação...")
            await asyncio.sleep(5)

            # Capturar estado final
            final_hash = await page.evaluate("window.location.hash")

            # Imprimir logs capturados
            print("\n" + "="*60)
            print("📋 LOGS DO CONSOLE (Browser)")
            print("="*60)
            for log in console_logs:
                prefix = "  " if log["type"] not in ["log", "error"] else ""
                print(f"{prefix}[{log['type'].upper()}] {log['text']}")

            print("\n" + "="*60)
            print("🎯 ESTADO FINAL")
            print("="*60)
            print(f"Hash final: {final_hash}")
            print(f"URL final: {await page.evaluate('window.location.href')}")

            await browser.close()

    asyncio.run(debug_invite_flow())

except ImportError as e:
    print(f"⚠️  Erro: {e}")
    print("Instale Playwright com: pip install playwright")
    print(f"\n📌 Para testar manualmente:")
    print(f"1. Abra: {test_url}")
    print(f"2. Pressione F12 para abrir o DevTools")
    print(f"3. Veja o Console para os logs 🔍")

except Exception as e:
    print(f"❌ Erro durante teste: {e}")

finally:
    # Parar servidor
    print("\n🛑 Parando servidor...")
    http_process.terminate()
    try:
        http_process.wait(timeout=5)
    except:
        http_process.kill()
    print("✅ Finalizado")
