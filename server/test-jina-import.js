import('file://' + process.cwd() + '/src/utils/jina.ts').then(m => console.log('Success:', m)).catch(e => {
  console.log('Error keys:', Reflect.ownKeys(e));
  console.log('Error inspect:', require('util').inspect(e, { showHidden: true, depth: null }));
});
