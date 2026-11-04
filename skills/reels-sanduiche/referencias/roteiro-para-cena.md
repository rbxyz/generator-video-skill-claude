# Do roteiro à cena: como decidir o que vai na tela

Use quando o pedido vier como um roteiro (tabela Tempo / Fala / Visual / Texto na tela) ou como um prompt curto.

## 1. Alinhar o roteiro com a fala REAL

O tempo escrito no roteiro é uma estimativa. O que vale é o `fala.json`.
- Liste as palavras com tempo: `python -c "import json;d=json.load(open('public/<clip>/fala.json'));print(' '.join(f\"{w['p']}@{w['ini']}\" for w in d['palavras']))"`
- Para cada linha do roteiro, ache a primeira palavra do trecho e a palavra-chave de cada texto de tela.
- O apresentador costuma trocar palavras, acrescentar trechos ou mudar a ordem de uma enumeração (o roteiro diz "A, B, C" e ele fala "B, A, C"). **Siga a fala**, não o roteiro, e avise o usuário das diferenças relevantes.

## 2. Mapear cada trecho para um bloco

| Tipo de trecho | Tratamento que funcionou |
|---|---|
| Gancho / número de impacto | Número gigante em 3D **atrás da cabeça**, entrando na palavra exata; fundo escurece levemente; pílula de apoio embaixo; push-in lento (1 → 1,08) |
| Fato / explicação de um sistema ou dado | Uma metáfora visual **atrás da pessoa**, ocupando todo o fundo (ex.: uma tabela em CSS 3D que rola, trava num limite e se desintegra), com pílulas curtas em sequência no HUD |
| Virada / tensão ("só que o problema não foi…") | **Corte seco** com zoom fixo de 1,28 no rosto, fundo escuro a 82% e frase em 3D atrás da cabeça. Fecha com uma anotação manuscrita (Caveat) e um sublinhado desenhado à mão. |
| Lista / mecanismo / etapas | Pílulas numeradas empilhadas com ↓, cada uma na palavra correspondente; a última em cor de destaque |
| Ferramenta com nome | Nome em 3D atrás da cabeça + selo pequeno no topo (ex.: "FERRAMENTA <MARCA>") |
| Perguntas contadas nos dedos | Cards numerados no HUD **e** `<ContadorNaMao marcas>` na camada `Frente` (o número segue o indicador da mão mais alta) |
| Conclusão / regra | Palavra-conceito em 3D atrás da cabeça + pílulas que pipocam na ordem da fala |
| Tese (contraste A × B) | Tipografia grande: palavra A na cor de destaque, palavra B riscada em vermelho |
| CTA | Pílula grande com a pergunta + anotação manuscrita (ex.: "comenta aqui") + seta ↓ animada; dolly in até 1,3 no rosto |

Visual que o roteiro pede e você **não tem** (print real de notícia, gravação de caderno, gravação de tela): não invente prints de veículos reais. Troque por uma metáfora visual neutra e avise o usuário, ou deixe um espaço reservado para ele inserir o material.

## 3. Texto fixo no topo

Se o roteiro pedir um texto fixo, ele entra depois do gancho e **some nos trechos com título 3D no topo** (os dois disputam a mesma faixa). Avise o usuário dessa escolha.

## 4. Legendas

Com muitos textos de tela, legenda corrida polui. Pergunte ou ofereça. Se for fazer, gere a partir de `fala.json`, com 2 a 4 palavras por vez, em y ≈ 1450.

## 5. Revisão antes do render final

Gere de 6 a 8 stills em `--scale=0.4`, um por bloco, junte numa grade (`ffmpeg ... -vf tile=4x2`) e confira:
- se tem texto cortado nas bordas ou atrás de outro texto;
- se o título 3D está realmente ATRÁS da cabeça (se estiver na frente, a camada da pessoa quebrou);
- se as pílulas quebram de linha de forma feia (envolva o conteúdo misto em `<span>`);
- se o elemento preso à mão aparece (visibilidade do landmark acima de 0,5).
