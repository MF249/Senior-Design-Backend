require('express');
require('mongodb');

exports.setApp = function (app, client)
{
    app.get('/getAllUsers', async (req, res) => {
        
        let errorMsg = '';
        var ret, result;

        try {
            await client.connect();
            console.log("Users:");
            result = await client.db("AppTest").collection("Users").find().toArray();
            console.log(typeof result);
        } catch(e) {
            console.error(e);
        } finally {
            await client.close();
        }

        if(result) {
            var ret = result;
            ret = Object.assign(ret);
            res.status(200).json(ret);
        } else {
            var ret = "No users yet exist.";
            res.status(500).json(ret);
        }
    });
    
    app.post('/login', async (req, res) => {
        
        const { username, password } = req.body;
        const db = await client.db();
        const results = await db.collection("AppTest.Users").findOne({
            username : username,
            password : password
        });

        let id = -1;
        let name = '';
        let errorMsg = '';

        if(results) {
            id = results._id;
            name = results.name;

            var ret = id + " : " + name;
            ret = Object.assign(ret, { error : errorMsg });

            res.status(200).json(ret);
        } else {
            var ret = id + " : " + name;
            errorMsg = "Username/password is incorrect.";
            ret = Object.assign(ret, {error : errorMsg});

            res.status(500).json(ret);
        }
    });

    app.post('/register', async (req, res) => {

        const newUser = new User ({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            username: req.body.username,
            password: req.body.password
        });
        const db = await client.db();
        
        const userExist = await db.collection('Users').find({
            username : newUser.username
        }).toArray();
        
        const emailExist = await db.collection('Users').find({
            email : newUser.email
        }).toArray();

        let errorMsg = 0;
        var ret;

        if (userExist.length != 0) {
            errorMsg = "Username has already been taken.";
            ret = { error : errorMsg };
            res.status(500).json(ret);
            return;
        }

        if (emailExist.length != 0) {
            errorMsg = "An account with that email has already been created.";
            ret = { error : errorMsg };
            res.status(500).json(ret);
            return;
        }
    });
}