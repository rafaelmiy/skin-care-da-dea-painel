# Skin da Déa — Painel estático de produtos

Painel web estático com foco em produtos **vencidos** e **vencendo**, inspirado no layout enviado.

## O que foi implementado

- Visual de dashboard com:
  - busca por produto/marca,
  - filtros (Todos, Vencidos, Vencendo, Favoritos, Manhã, Noite),
  - cards responsivos com imagem, marca, categoria, badge de validade e preço,
  - resumo com contadores (total, vencidos, vencendo e favoritos).
- Ordenação por validade (mais urgente primeiro).
- Integração com **Firebase Realtime Database** no nó `products`.
- Fallback automático para dados de exemplo quando o Firebase não está configurado/disponível.

## Estrutura esperada no Firebase Realtime Database

Caminho: `products`

Exemplo (objeto):

```json
{
  "products": {
    "abc123": {
      "name": "Protetor solar FPS 50",
      "brand": "Vichy",
      "category": "Rosto",
      "expiresAt": "2026-02-10",
      "openedAt": "2025-10-10",
      "favorite": true,
      "routine": ["morning"],
      "price": 60,
      "image": "https://..."
    }
  }
}
```

Também aceita array em `products`.

## Configuração

1. As configurações do Firebase já estão preenchidas em `app.js` para o projeto `skin-care-b`.
2. Sirva os arquivos com um servidor local (devido ao ES Module do Firebase):

```bash
python3 -m http.server 4173
```

3. Acesse `http://localhost:4173`.

## Arquivos

- `index.html` — estrutura da interface.
- `styles.css` — estilos principais do painel.
- `app.js` — lógica de filtros, renderização e leitura do Firebase.
