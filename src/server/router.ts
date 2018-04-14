import { readFile } from 'fs';
import { promisify } from 'util';
import * as _ from 'lodash';
import * as Router from 'koa-router';
import * as IPFS from 'ipfs-api';
import { default as Web3 } from 'web3';

import { LoggerFactory } from '../utils/logger';

const router = new Router();
const ipfs = IPFS({
  host: 'localhost',
  port: 5001,
  protocol: 'http',
});
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const logger = LoggerFactory.getLabeledInstance('server', 'router');
const uploadAsync = promisify(ipfs.files.add);
const getIpfsNodeId = promisify(ipfs.id);
const getIpfsSwarmPeers = promisify(ipfs.swarm.peers);
const readFileAsync = promisify(readFile);

router.get('/', async (ctx, next) => {
  ctx.body = 'Hello, Heronode!';
  await next();
});

router.post('/api/ipfs/upload/raw', async (ctx, next) => {
  const body = (ctx.request as any).fields;
  const content = _.get(body, 'content');
  if (!content) {
    logger.info('body content is empty!');
    ctx.status = 500;
    ctx.body = 'please make sure content field is not empty';
    await next;
    return;
  }
  logger.info(`uploading content: ${content}`);
  try {
    const resp = await uploadAsync(Buffer.from(content));
    ctx.body = resp;
  } catch (err) {
    ctx.body = err;
    ctx.status = 500;
  }
  await next;
});

router.post('/api/ipfs/upload/file', async (ctx, next) => {
  const body = _.head(_.values((ctx.request as any).fields));
  const filePath = _.get(_.head(body), 'path');
  logger.info(`uploading content with path: ${filePath}`);
  const fileContent = await readFileAsync(filePath);
  const resp = await uploadAsync(fileContent);
  ctx.body = resp;
  await next;
});

router.get('/dashboard', async ctx => {
  await ctx.render('index');
});

router.get('/internal/nodeinfo', async ctx => {
  const [nodeId, peers] = await Promise.all([
    getIpfsNodeId(),
    getIpfsSwarmPeers(),
  ]);
  const addrs = _.reduce(
    peers,
    (accu, peer) => {
      const addrInfoArr = peer.addr.toString().split('/');
      accu.push(addrInfoArr[2]);
      return accu;
    },
    [],
  );
  ctx.body = { nodeId, addrs, eth: web3.eth.defaultAccount };
});

export default router;
