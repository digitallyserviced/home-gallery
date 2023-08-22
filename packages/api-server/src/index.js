
const server = require('./server');
const { load: loadTensorflow } = require('./tensorflow');
const { modelConfig, modelDir } = require('./model-config');

const routes = require('./routes');

const BACKENDS = ['cpu', 'wasm', 'node'];

const run = async () => {
  const port = process.env.PORT || 3001;
  const maxBytes = process.env.MAX_BYES || 2 * 1024 * 1024; // 2 MB;

  const backend = 'node'; //BACKENDS.indexOf(process.env.BACKEND) >= 0 ? process.env.BACKEND : 'node';
  console.log(`Loading tensorflow and models`);
  const { embeddings, objects, faces } = await loadTensorflow(backend, modelConfig, modelDir);

  console.log(`Starting server`);
  const app = await server({port});

  console.log(`Setup api routes`);
  routes(app, maxBytes, modelConfig, embeddings, objects, faces);
  return app;
}

module.exports = run;
