const SUPABASE_URL = "https://gzmelzyaipixzmyizvxd.supabase.co";

const SUPABASE_CHAVE = "sb_publishable_VL6QVhb6CtZoHeqgBGAU3w_tNfgMCfm";

const GROQ_CHAVE = "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";

const URL_SUPABASE =
    SUPABASE_URL + "/rest/v1/perguntas";

const URL_GROQ =
    "https://api.groq.com/openai/v1/chat/completions";

const form = document.getElementById("form");
const campoPergunta = document.getElementById("pergunta");
const botao = document.getElementById("botao");

const aviso = document.getElementById("status");
const respostaTela = document.getElementById("resposta");
const historico = document.getElementById("historico");
async function falarComIA(pergunta) {

  const resposta = await fetch(URL_GROQ, {

      method: "POST",

      headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + GROQ_CHAVE
      },

      body: JSON.stringify({

        model: "openai/gpt-oss-120b",

          messages: [
              {
                  role: "system",
                  content: "Você é um assistente de estudos. Responda em português, de forma simples, clara e em até 5 linhas."
              },

              {
                  role: "user",
                  content: pergunta
              }
          ]

      })

  });

  if (!resposta.ok) {
      throw new Error("Erro " + resposta.status);
  }

  const dados = await resposta.json();

  const texto =
      dados.choices?.[0]?.message?.content?.trim();

  if (!texto) {
      throw new Error("Resposta vazia da IA.");
  }

  return texto;
}

async function salvarNoBanco(pergunta, resposta) {

  const resultado = await fetch(URL_SUPABASE, {

      method: "POST",

      headers: {
          apikey: SUPABASE_CHAVE,
          "Content-Type": "application/json"
      },

      body: JSON.stringify({
          pergunta: pergunta,
          resposta: resposta
      })

  });

  if (!resultado.ok) {
      throw new Error("Erro " + resultado.status);
  }

}
function mostrarHistorico(perguntas) {

  historico.innerHTML = "";

  perguntas.forEach(function(item) {

      const caixa = document.createElement("div");
      caixa.className = "item-historico";

      const titulo = document.createElement("h3");
      titulo.textContent = "Pergunta: " + item.pergunta;

      const texto = document.createElement("p");
      texto.textContent = "Resposta: " + item.resposta;

      const botaoExcluir = document.createElement("button");
      botaoExcluir.textContent = "Apagar";
      botaoExcluir.className = "excluir";

      botaoExcluir.addEventListener("click", function() {
          apagarPergunta(item.id);
      });

      caixa.append(titulo);
      caixa.append(texto);
      caixa.append(botaoExcluir);

      historico.append(caixa);

  });

}
async function carregarHistorico() {

  try {

      const resultado = await fetch(
          URL_SUPABASE + "?select=*&order=created_at.desc",
          {
              headers: {
                  apikey: SUPABASE_CHAVE
              }
          }
      );

      if (!resultado.ok) {
          throw new Error("Erro " + resultado.status);
      }

      const dados = await resultado.json();

      mostrarHistorico(dados);

  } catch (erro) {

      aviso.textContent =
          "Não foi possível carregar o histórico: " + erro.message;

  }

}
async function apagarPergunta(id) {

  try {

      const resultado = await fetch(
          URL_SUPABASE + "?id=eq." + id,
          {
              method: "DELETE",

              headers: {
                  apikey: SUPABASE_CHAVE
              }
          }
      );

      if (!resultado.ok) {
        throw new Error("GROQ_" + resposta.status);
      }

      await carregarHistorico();

      aviso.textContent = "Pergunta apagada com sucesso.";

  } catch (erro) {

      aviso.textContent =
          "Não foi possível apagar: " + erro.message;

  }

}
form.addEventListener("submit", async function(event) {

  event.preventDefault();

  const pergunta = campoPergunta.value.trim();

  if (!pergunta) {
      aviso.textContent = "Escreva uma dúvida primeiro.";
      return;
  }

  botao.disabled = true;
  botao.textContent = "Pensando...";
  aviso.textContent = "";
  respostaTela.textContent = "";

  try {

      // 1. Perguntar à IA
      const resposta = await falarComIA(pergunta);

      // 2. Mostrar resposta na tela
      respostaTela.textContent = resposta;

      // 3. Tentar salvar no banco
      try {

          await salvarNoBanco(pergunta, resposta);

          aviso.textContent = "Pergunta salva com sucesso!";

          await carregarHistorico();

      } catch (erroBanco) {

          aviso.textContent =
              "A IA respondeu, mas NÃO foi salva no banco: " +
              erroBanco.message;

      }

      campoPergunta.value = "";

  } catch (erro) {

      if (erro.message === "GROQ_401") {

          aviso.textContent = "Falha na IA: chave inválida (401).";

      } else if (erro.message === "GROQ_429") {

          aviso.textContent =
              "Muitos pedidos! Espere um pouco e tente novamente.";

      } else if (erro.message === "Resposta vazia da IA.") {

          aviso.textContent =
              "A IA retornou uma resposta vazia.";

      } else {

          aviso.textContent =
              "Falha na IA. Verifique sua internet ou tente novamente.";

      }

  } finally {

      botao.disabled = false;
      botao.textContent = "Perguntar";

  }

});
carregarHistorico();