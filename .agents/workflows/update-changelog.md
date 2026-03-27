---
description: Como atualizar o CHANGELOG.md a cada modificação no OnBible
---

# Regra: Sempre Atualizar o CHANGELOG

Toda modificação relevante no projeto **OnBible** deve ser registrada em `CHANGELOG.md` **antes de commitar**.

## Formato

O CHANGELOG segue o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/):

```
## [Unreleased]

### Adicionado
- Descrição objetiva da nova funcionalidade

### Corrigido
- Descrição do bug corrigido e causa raiz

### Alterado
- Mudanças em funcionalidades existentes

### Removido
- Funcionalidades removidas
```

## Passos

1. Abra o arquivo `CHANGELOG.md` na raiz do projeto
2. Localize a seção `## [Unreleased]`
3. Adicione sua mudança na categoria correta (`Adicionado`, `Corrigido`, `Alterado` ou `Removido`)
4. Seja específico: mencione o arquivo afetado, o comportamento anterior e o novo

// turbo
5. Verifique se o CHANGELOG está atualizado antes de commitar:
```bash
git diff CHANGELOG.md
```

## Ao Criar uma Release

Quando for fazer um commit de release:

1. Renomeie `## [Unreleased]` para `## [X.Y.Z] — YYYY-MM-DD` seguindo semver
2. Crie um novo `## [Unreleased]` vazio acima
3. Faça commit com a mensagem: `chore: release vX.Y.Z`

## Categorias de Semver

| Tipo de mudança | Versão |
|---|---|
| Correção de bug sem quebra de API | `PATCH` (0.0.**X**) |
| Nova funcionalidade compatível | `MINOR` (0.**X**.0) |
| Quebra de compatibilidade | `MAJOR` (**X**.0.0) |
