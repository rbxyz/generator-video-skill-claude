import { Config } from "@remotion/cli/config";

// Sem GPU: WebGL por software (SwiftShader via ANGLE). Com GPU, troque para "angle".
Config.setChromiumOpenGlRenderer("swangle");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Máquina com pouca RAM: limite de abas de render em paralelo
Config.setConcurrency(3);
