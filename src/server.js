import { createApp } from './app.js';
import { config } from './config/index.js';

const app = createApp();
app.listen(config.port, () => {
  console.log(
    `[INFO] Server running on http://localhost:${config.port} (${config.nodeEnv})`,
  );
});