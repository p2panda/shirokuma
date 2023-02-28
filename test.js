import { initWebAssembly, Session, KeyPair } from './lib/node/index.cjs';

async function run() {
  await initWebAssembly();

  const kp = new KeyPair();
  const session = new Session('http://127.0.0.1:2020/graphql').setKeyPair(kp);

  const Chat = session.addSchema(
    'chat_0020bc874c401ad598364be80d18ca5ecf2f8e97d0cb5774538f62a6f08c1b4fce54',
  );

  const message = await Chat.create({
    message: 'HAALLO',
  });

  await message.update({
    message: 'blaaa',
  });

  await message.update({
    message: 'PAPA',
  });
}

run();
