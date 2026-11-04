# MIT License

Copyright (c) 2026 Ruan Bueno

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Componentes de terceiros

A licença MIT acima cobre apenas o código e a documentação deste repositório
(`SKILL.md`, `scripts/`, `template/` e `referencias/`). As dependências abaixo
não são distribuídas aqui: são instaladas ou baixadas em tempo de execução e
seguem as próprias licenças.

| Componente | Licença | Observação |
|---|---|---|
| [Remotion](https://www.remotion.dev) | Remotion License | Gratuita para indivíduos e empresas pequenas; empresas maiores precisam de licença comercial. Consulte os termos atuais em remotion.dev/license. |
| [Robust Video Matting](https://github.com/PeterL1n/RobustVideoMatting) | GPL-3.0 | Modelo baixado em tempo de execução, não incluído no repositório. |
| [MediaPipe](https://ai.google.dev/edge/mediapipe) | Apache-2.0 | |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) | MIT | |
| [three.js](https://threejs.org) | MIT | |
| Anton, Inter, Caveat (Google Fonts) | SIL Open Font License 1.1 | Baixadas pelo `novo-projeto.sh`. |

Quem usar esta skill é responsável por verificar e cumprir as licenças dessas
dependências, principalmente a do Remotion em uso comercial.
