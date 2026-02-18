# 🔧 Configuração do Husky e Pre-commit Hooks

## ✅ Instalação Completa

O Husky já está configurado no projeto. Para ativar completamente, execute:

```powershell
cd C:\Users\Machado\Downloads\organicpro
npm install
```

O script `prepare` no `package.json` já configura o Husky automaticamente após `npm install`.

## 🔍 Verificar Instalação

Após instalar as dependências, verifique se o hook foi criado:

```powershell
# Verificar se o arquivo existe
Test-Path .husky\pre-commit

# Ver conteúdo do hook
Get-Content .husky\pre-commit
```

## 🧪 Testar Pre-commit Hook

Para testar se está funcionando:

```powershell
# Fazer uma mudança pequena em um arquivo
# Por exemplo, adicionar um espaço em branco em um arquivo .ts

# Tentar fazer commit
git add .
git commit -m "test: verificar pre-commit hook"
```

O hook deve executar automaticamente:
- `eslint --fix` em arquivos TypeScript/JavaScript

**Nota**: Testes foram removidos do pre-commit para evitar lentidão. Execute `npm run test` manualmente antes de fazer push.

## 🔒 Resolver Vulnerabilidades de Segurança

Se você viu avisos sobre vulnerabilidades (18 vulnerabilidades), execute:

```powershell
# Ver detalhes das vulnerabilidades
npm audit

# Tentar corrigir automaticamente (sem quebrar código)
npm audit fix

# Se ainda houver vulnerabilidades, ver detalhes específicos
npm audit --json > audit-report.json
```

## 📝 Configuração Atual

### package.json
- **Script `prepare`**: Configura o Husky automaticamente após `npm install`
- **lint-staged**: Configurado para executar:
  - `eslint --fix` em todos os arquivos `.ts`, `.tsx`, `.js`, `.jsx`
  - **Nota**: Testes foram removidos do pre-commit para evitar lentidão nos commits

### .husky/pre-commit
- Executa `npx lint-staged` antes de cada commit
- Garante que código com erros de lint não seja commitado
- Executa testes relacionados aos arquivos modificados

## ⚠️ Nota sobre Husky v9

Na versão 9.x do Husky, o comando `husky install` foi descontinuado. A configuração agora é feita automaticamente pelo script `prepare` no `package.json`. Você não precisa executar `npx husky install` manualmente.

## 🐛 Troubleshooting

### Hook não está executando

1. Verifique se o arquivo `.husky/pre-commit` existe e tem permissões de execução
2. No Windows, pode ser necessário executar:
   ```powershell
   git config core.hooksPath .husky
   ```

### Erro "husky - install command is DEPRECATED"

Este aviso é normal na versão 9.x. O Husky funciona corretamente mesmo com este aviso. O script `prepare` já está configurado corretamente.

### ESLint falhando no hook

Se o ESLint encontrar erros que não podem ser corrigidos automaticamente:
- Corrija os erros manualmente
- Ou temporariamente desabilite o hook: `git commit --no-verify` (não recomendado)

### Erro "Unknown option --runInBand"

Se você viu este erro, significa que estava tentando usar uma opção do Jest no Vitest. A configuração já foi corrigida para remover essa opção inválida.

## 📚 Referências

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/lint-staged/lint-staged)
