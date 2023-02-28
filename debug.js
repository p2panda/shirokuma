import { initWebAssembly, Session, KeyPair } from './lib/node/index.cjs';

const ENDPOINT = 'http://127.0.0.1:2020/graphql';
const SCHEMA_ID =
  'chat_002009a6721c3015eb87a7b941e5d54183b7bd209c72dec05af234ede47dd4772f35';

async function run() {
  await initWebAssembly();

  const keyPair = new KeyPair();
  const session = new Session(ENDPOINT).setKeyPair(keyPair);

  const Chat = session.addSchema(SCHEMA_ID);

  const message = await Chat.create({
    message: '1',
  });

  await message.update({
    message: '2',
  });

  await message.update({
    message: '3',
  });
}

run();
