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
5. **Checklist antes de concluir a tarefa:** se alterou `src/`, `tests/`, `db/` com impacto no utilizador, ou configuração de build, o `CHANGELOG.md` **tem** de constar no mesmo conjunto de alterações (commit ou PR).
6. Verifique se o CHANGELOG está atualizado antes de commitar:
```bash
git diff CHANGELOG.md
```

## Hook `pre-commit` (Husky)

Após `npm install`, o Husky instala o hook em `.husky/pre-commit`, que executa `scripts/check-changelog-staged.mjs`.

- Se existirem alterações **em stage** em `src/` ou `tests/` sem `CHANGELOG.md` também em stage, o commit **falha** com mensagem de ajuda.
- Para um commit pontual sem atualizar o changelog (ex.: WIP interno): `SKIP_CHANGELOG=1 git commit ...`
- Para contornar todos os hooks: `git commit --no-verify` (evitar em alterações que deviam ter changelog).

Teste manual da regra: `npm run check:changelog` (usa o mesmo critério com o que já está no stage).

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
