const cors = require ('cors')

const whiteList = [
  "https://code.octimize.cl",
  "http://localhost:5173"
];

export const customCors = cors({
  origin: (origin: string | undefined, callback: Function) => {
    if (!origin || whiteList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Site: ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
});
