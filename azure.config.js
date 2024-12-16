module.exports = {
  name: 'RatedSAfrika',
  script: 'ts-node-dev',
  args: 'src/main.ts',
  watch: true,
  ignore_watch: ['node_modules'],
  env: {
    NODE_ENV: 'development',
    PORT: 8080,
  },
};
