# Precificador Marketplace 2026

## Status atual
- App SPA completo: 3 views (Calcular, Comparar, Histórico)
- Motor de cálculo validado (smoke-test 5/5 plataformas)
- PWA com service worker (cache psp-v2, offline-first)
- Deploy automático via GitHub Actions → precificador.ruahtecnologia.com.br

## Escopo
Precificador cobrindo 5 plataformas: ML, Shopee, Amazon, TikTok, Shein
Funcionalidades: modo comparação, calculadora individual, histórico CSV

## Regra de deploy

Após qualquer alteração de código, sempre rodar:

```bash
git add . && git commit -m 'descrição da alteração' && git push origin main
```

O deploy é automático via GitHub Actions após o push.
