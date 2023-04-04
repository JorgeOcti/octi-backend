import ImportIXnetQueue from './importIXnet.task';

const importIXnet = new ImportIXnetQueue();
importIXnet.run();
// Repeat every 30 seconds for 100 times
// importIXnet.queue.add(
//   'main',
//   {},
//   {
//     repeat: {
//       every: 1000 * 60 * 5
//       // limit: 5
//     },
//     attempts: 3,
//     removeOnComplete: true
//   }
// );
// importIXnet.queue.add('main', {}, { attempts: 3, removeOnComplete: true });
