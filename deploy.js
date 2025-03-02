const FtpDeploy = require('ftp-deploy');
const ftpDeploy = new FtpDeploy();

const config = {
  user: "YOUR_FTP_USERNAME",
  password: "YOUR_FTP_PASSWORD",
  host: "YOUR_FTP_HOST", // e.g., ftp.your-ovh-domain.com
  port: 21,
  localRoot: __dirname + '/dist',
  remoteRoot: "/www/", // or your web directory path
  include: ['*', '**/*'],
  exclude: ['**/*.map', 'node_modules/**', 'src/**'],
  deleteRemote: false, // Set to true to delete files on the remote that don't exist locally
  forcePasv: true
};

ftpDeploy
  .deploy(config)
  .then(res => console.log('Deployment complete!'))
  .catch(err => console.log(err));