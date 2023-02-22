const server = require('./server');

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || '0.0.0.0';

server
  .create()
  .then((app) => {
    app.listen(port, hostname, () => {
      console.log(`Server has started on port ${port}! and ${hostname}`);
    });
  })
  .catch((err) => console.log(err));
