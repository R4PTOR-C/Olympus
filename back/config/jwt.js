// Fonte única do segredo JWT.
// Falha no boot se não estiver configurado — evita usar um segredo default
// previsível em produção (vulnerabilidade de forja de token).
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("❌ JWT_SECRET não configurado. Defina a variável de ambiente antes de iniciar o servidor.");
    process.exit(1);
}

module.exports = { JWT_SECRET };
