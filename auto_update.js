const http = require('http');
const spawn = require('child_process').spawn;
const createHandler = require('github-webhook-handler');

const handler = createHandler({
  path: '/webhook',
  secret: 'ab6504137845'
});

http.createServer((req, res) => {
  handler(req, res, err => {
    res.statusCode = 404;
    res.end('no such location');
  });
}).listen(7777);

handler.on('error', err => {
  console.error('Error:', err.message);
});

handler.on('push', event => {
  console.log('Received push event');
  
  // 拉取最新代码
  const pull = spawn('git', ['pull']);
  
  pull.stdout.on('data', data => {
    console.log(`stdout: ${data}`);
  });
  
  pull.stderr.on('data', data => {
    console.error(`stderr: ${data}`);
  });
  
  pull.on('close', code => {
    if (code === 0) {
      console.log('Git pull successful');
      // 重新安装依赖（如果有变更）
      const install = spawn('npm', ['install']);
      
      install.on('close', code => {
        if (code === 0) {
          // 重新构建网站
          const build = spawn('npm', ['run', 'build']);
          build.on('close', code => {
            console.log(`Build process exited with code ${code}`);
          });
        }
      });
    }
  });
});
