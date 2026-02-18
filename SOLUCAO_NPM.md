# 🔧 Solução para Problemas com npm install

## Problema
Erro `EPERM` ao tentar instalar dependências ou executar comandos npm.

## Soluções (tente nesta ordem)

### 1. **Executar PowerShell como Administrador**

1. Feche todos os terminais abertos
2. Clique com botão direito no PowerShell
3. Selecione "Executar como Administrador"
4. Navegue até o projeto:
   ```powershell
   cd C:\Users\Machado\Downloads\organicpro
   ```

### 2. **Fechar Processos que Podem Estar Travando**

Antes de executar `npm install`, feche:
- ✅ Cursor/VS Code
- ✅ Qualquer terminal rodando `npm run dev`
- ✅ Antivírus temporariamente (ou adicione exceção para a pasta)
- ✅ Windows Defender (temporariamente)

### 3. **Limpar e Reinstalar**

```powershell
# No PowerShell como Administrador
cd C:\Users\Machado\Downloads\organicpro

# Deletar node_modules e package-lock.json
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path package-lock.json -Force -ErrorAction SilentlyContinue

# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
npm install
```

### 4. **Se Ainda Não Funcionar - Usar CMD**

Abra o **Prompt de Comando (CMD) como Administrador**:

```cmd
cd C:\Users\Machado\Downloads\organicpro

rmdir /s /q node_modules
del package-lock.json

npm cache clean --force
npm install
```

### 5. **Alternativa: Usar Yarn**

Se npm continuar com problemas, tente usar Yarn:

```powershell
# Instalar Yarn globalmente (se não tiver)
npm install -g yarn

# No diretório do projeto
cd C:\Users\Machado\Downloads\organicpro
yarn install
yarn dev
```

### 6. **Verificar se Vite Está Instalado**

Após instalar, verifique:

```powershell
# Verificar se vite existe
Test-Path node_modules\.bin\vite.cmd

# Ou testar diretamente
npx vite --version
```

### 7. **Executar Comandos**

Depois de instalar com sucesso:

```powershell
# Servidor de desenvolvimento
npm run dev

# Testes
npm run test

# Build
npm run build
```

## ⚠️ Se Nada Funcionar

1. **Reiniciar o computador** e tentar novamente
2. **Verificar permissões da pasta**:
   - Clique com botão direito na pasta `organicpro`
   - Propriedades → Segurança
   - Certifique-se de ter permissões de escrita

3. **Verificar antivírus**:
   - Adicione exceção para `C:\Users\Machado\Downloads\organicpro`
   - Ou desative temporariamente para testar

## 📝 Nota sobre o Sandbox

O Cursor usa um sandbox que pode ter limitações de permissão. Para operações npm, é recomendado executar no seu terminal local (PowerShell/CMD) ao invés do sandbox do Cursor.
