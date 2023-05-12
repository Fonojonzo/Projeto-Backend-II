const express = require("express");
const { pool } = require("./data/data");
const jwt = require("jsonwebtoken");
const app = express();


app.use(express.json());

app.get('/', (req, res) => {
    res.send('<h1>Página Teste</h1>')
})

app.get('oi', (req, res) => {
    res.send('<h1>Página Teste 2</h1>')
})

app.listen(3000, () => {
    console.log("O servidor está ativo na porta 3000!")
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const client = await pool.connect();

    // Tenta procurar pelo email.
    const ProcurarUsuario = await client.query(`SELECT * FROM users where email='${email}'`);
    if (!ProcurarUsuario) { // Se não encontrar o usuário.
        return res.status(401).json({ error: 'O usuário não foi encontrado.' });
    }

    // Checa a senha.
    if (parseInt(ProcurarUsuario.rows[0].password) !== password) { // Se a senha não for correta.
        return res.status(401).json({ error: 'A senha está incorreta.' });
    }

    const { id, name } = ProcurarUsuario.rows[0]
    return res.status(200).json({// Retorna a resposta com os dados do usuário.
        user: {
            id,
            name,
            email,
        },
        token: jwt.sign({ id }, process.env.SECRET_JWT, {
            expiresIn: process.env.EXPIRESIN_JWT,
        }),
    });
})

app.get("/users", async (req, res) => {
    // Tenta pegar todos os usuários.
    try {
        const client = await pool.connect();
        const { rows } = await client.query("SELECT * FROM Users");
        console.table(rows);
        res.status(200).send(rows);
    }catch (error){ 
        console.error(error);
        res.status(500).send("Erro ao conectar com o servidor.");
    }
});

app.post("/users", async (req, res) => {
    try {
        const { id, name, email, password } = req.body
        const client = await pool.connect();
        if (!id || !name || !email || !password) { // Se faltar algum campo.
            return res.status(401).send("Algum campo não foi preenchido corretamente.")
        }
        const Usuario = await client.query(`SELECT FROM users where id=${id}`);
        if (Usuario.rows.length === 0) {
            await client.query(`INSERT into users values (${id}, '${email}', '${password}', '${name}')`)
            res.status(200).send({
                msg: "Sucesso ao cadastrar o usuário.",
                result: {id,email,password,name}
            });
        } else {
            res.status(401).send("O usuário já está cadastrado.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao conectar com o servidor.");
    }
})

app.put("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;

        const client = await pool.connect();
        if (!id || !name) {
            return res.status(401).send("O campo ID/NOME está vazio.")
        }
        const Usuario = await client.query(`SELECT FROM users where id=${id}`);
        if (Usuario.rows.length > 0) {
            await client.query(`UPDATE users SET name = '${name}',email ='${email}',password ='${password}' WHERE id=${id}`);
            res.status(200).send({
                msg: "O usuário foi atualizado com sucesso!",
                result: {id,email,password,name}
            });
        } else {
            res.status(401).send("O usuário não foi encontrado.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao conectar com o servidor.");
    }
})

app.delete("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (id === undefined) {
            return res.status(401).send("O usuário não foi informado.")
        }
        const client = await pool.connect();
        const del = await client.query(`DELETE FROM users where id=${id}`)

        if (del.rowCount == 1) {
            return res.status(200).send("O usuário foi deletado com sucesso!");
        } else {
            return res.status(200).send("O usuário não foi encontrado.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao conectar com o servidor.");
    }
})


