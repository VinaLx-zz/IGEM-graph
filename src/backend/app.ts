/* tslint:disable: no-console */

import * as express from "express";
import * as path from "path";

const app = express();
const port = 8080;

app.use(express.static(path.join(__dirname, "../node_modules")));
app.use(express.static(path.join(__dirname, "../static")));

app.use(express.static(__dirname));

app.listen(port, "0.0.0.0", () => {
    console.log(`listening on http://localhost:${port}`);
});
