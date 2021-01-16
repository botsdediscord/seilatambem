const router = require("express").Router();
const Discord = require("discord.js");
const client = new Discord.Client();
const firebase = require("firebase")
const session = require("express-session");
const passport = require("passport");
const Strategy = require("../lib").Strategy;
const config = require("../config.json")
const Bots = require("../Clusters/Models/Bots.js");
const Users = require("../Clusters/Models/Users.js")
const Analises = require("../Clusters/Models/Analises.js")

var firebaseConfig = {
    apiKey: "AIzaSyDkEkWuQnJMsOogUrIbXrQPe6XVT62eMoM",
    authDomain: "rocketlist-ace21.firebaseapp.com",
    databaseURL: "https://rocketlist-ace21.firebaseio.com",
    projectId: "rocketlist-ace21",
    storageBucket: "rocketlist-ace21.appspot.com",
    messagingSenderId: "641564054297",
    appId: "1:641564054297:web:cf6cd74153d1f493ea2b88",
    measurementId: "G-22CCXKE0JH"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

client.login(config.token);
client.on("ready", async () => {

  console.log("APLICAÇÃO INICIADA!");

  setInterval(async () => {

  let filter = {};
  let allBots = await Bots.find(filter)

  allBots.forEach(async function(bot) {

    client.users.fetch(bot._id).then(async member => {

      await Bots.findByIdAndUpdate(bot._id , { $set: { avatar: member.avatarURL({ dynamic: true, size: 4096 }) } })

    })
   })
 }, 120000)

});

passport.serializeUser(function(user, done) { done(null, user); });
passport.deserializeUser(function(obj, done) { done(null, obj); });


 passport.use(new Strategy({ clientID: config.clientID, clientSecret: config.clientSecret, callbackURL: config.redirectURL, scope: config.scopes, prompt: config.prompt },
                          
    function(accessToken, refreshToken, profile, done) {
  
      process.nextTick(function() {
        
        return done(null, profile);
        
      });
    }));

router.use(session({ secret: "keyboard cat", resave: true, saveUninitialized: true }));
router.use(passport.initialize());
router.use(passport.session());

router.get("/oauth2", passport.authenticate("discord", { scope: config.scopes, prompt: config.prompt }), function(req, res) { });

router.get("/", checkAuth, async(req, res) => {

  let filter  = {};
  let user    = req.session.user
  let allBots = await Bots.find(filter)

      new Users({
          _id: user.id
      }).save()

  Users.findOne({ _id: user.id }, async(err, dados) => {

    if(dados) {
    
    } else {
    
      new Users({
          _id: user.id
      }).save()

           let embed = new Discord.MessageEmbed()

.setDescription(`Usuário ${user.username} registrado na database com sucesso !`)
       
       client.channels.cache.get('779819654985941005').send(embed)
    }
  })
  
  res.render("index.ejs", { Bots: allBots, client, user })


});


router.post("/addbot/enviar", checkAuth, async(req, res) => {

      let dados = req.body
      let user = req.session.user
      
client.users.fetch(dados.id).then(member => {
      
      new Analises({
          _id: dados.id,
          name: dados.nome,
          prefix: dados.prefixo,
          invite: dados.botinvite,
          suporte: dados.botsuporte,
          owner: user.id,
          shortdescription: dados.descp,
          description: dados.descg,
          avatar: member.avatarURL({ dynamic: true, size: 4096 }),
      }).save()
  
  
client.channels.cache.get("779819631028076615").send(`<@!${user.id}> adicionou ${member.tag} para verificação! \n\ botsdediscord.glitch.me/discordbots/${dados.id}`)

  })
  res.render("addbot_enviar.ejs", { user, client })

})

router.get("/confirm/:botID", checkAuth, async (req, res) => {

  let filter  = {};
  let botID = req.params.botID
  let user    = req.session.user
  let allBots = await Bots.find(filter)

  await Bots.findOne({ _id: botID }, async (err, dados) => {

    if(dados) {

      res.render("anunciar.ejs", { user, client, dados })

      }

  })

    

});

router.get("/addbot", checkAuth, async(req, res) => {

  let user    = req.session.user
  
  res.render("addbot.ejs", { client, user })

})

router.get("/delete/:botID", checkAuth, async(req, res) => {

  let botID = req.params.botID
  let user  = req.session.user

  await Bots.findOne({ _id: botID }, async (err, dados) => {

        new Bots({
             _id: botID,
             name: dados.name,
             prefix: dados.prefix,
             invite: dados.invite,
             suporte: dados.suporte,
             owner: dados.owner,
             shortdescription: dados.shortdescription,
             description: dados.description,
             avatar: dados.avatar,
             livraria: dados.livraria
         }).delete()

client.channels.cache.get("779819631028076615").send(`<@!${botID}> by <@!${dados.owner}> was deleted by <@!${user.id}> !`)

    let embed2 = new Discord.MessageEmbed()
.setDescription(`<@!${dados.owner} Your bot <@!${botID}> was deleted by <@!${user.id}>!`)

    res.redirect("/analises")

    client.users.cache.get(dados.owner).send(embed2).catch(err => {

      let embed = new Discord.MessageEmbed().setDescription(`**|** Erro ao enviar mensagem para <@!${dados.owner}>\n\n\`\`\`js\n${err}\`\`\``)

      client.channels.cache.get('779819631028076615').send(embed)

    })

    client.guilds.cache.get('779815064676073512').members.cache.get(botID).kick({ reason: 'Bot deletado !' })

  })

})

router.get("/painel", checkAuth, async (req, res) => {

  let filter  = {};
  let user    = req.session.user
  let allBots = await Bots.find(filter)

  if(!client.guilds.cache.get('779815064676073512').members.cache.get(user.id)) return res.send('You must be a Adminstrator to access.')
  if(!client.guilds.cache.get('779815064676073512').members.cache.get(user.id).roles.cache.has(('779816060324413460'))) return res.send('Access denied !')

    setTimeout(() => {

     res.render("painel.ejs", { Bots: allBots, client, user })

    }, 2000)

});

router.get("/equipe", checkAuth, async(req, res) => {

  let user = req.session.user
  let userinfo = await client.users.fetch(user.id)
  let bots_perfil = []

  res.render("equipe.ejs", { userinfo, client, user });
             
});

router.get("/bots/:botID", checkAuth, async(req, res) => {

  let botID = req.params.botID
  let stringID = req.params.botID.toString();
  let user = req.session.user
  let ms = require('parse-ms')
  let daily = await db.ref(`Cowndown/Votes/${user.id}/${stringID}/Timer`).once('value')
      daily = daily.val()
  let timeout = 43200000
  let time = ms(timeout - (Date.now() - daily));


  await Bots.findOne({ _id: botID }, async (err, dados) => {

    if (dados) {

      if (daily !== null && timeout - (Date.now() - daily) > 0) {

          if(time) time = `Vote again on ${time.hours}h ${time.minutes}m ${time.seconds}s`
          
          let dono;
              dono = client.users.cache.get(dados.owner).tag

          res.render("info_bots.ejs", { dados, client, db, stringID, time, user, dono })

      } else {

          if(time) time = `Vote`
          
          let dono;
              dono = client.users.cache.get(dados.owner).tag

          res.render("info_bots.ejs", { dados, client, db, stringID, time, user, dono })
      }

    } else {

          res.render("error_bot.ejs", { dados, client, db, stringID, time, user,  })

    }

  })

})

router.get("/analisar/:botID", checkAuth, async(req, res) => {

  let botID = req.params.botID
  let user  = req.session.user
  let dono  = req.session.dono

  await Analises.findOne({ _id: botID }, async(err, dados) => {

    if(dados) {

      res.render("info_analise.ejs", { user, client, dados, dono })

      }

  })

})

router.get('/bots/:botID/votar', checkAuth, async (req, res) => {

    let user = req.session.user;
    let botID = req.params.botID;
    let stringID = req.params.botID.toString();
    let botdb = await Bots.findById(stringID);
    let ms = require('parse-ms')

 let daily = await db.ref(`Cowndown/Votes/${user.id}/${stringID}/Timer`).once('value')
     daily = daily.val()

 let timeout = 43200000

 if (daily !== null && timeout - (Date.now() - daily) > 0) {

            let time = ms(timeout - (Date.now() - daily)); 

            let err = `Calm down ${user.username}#${user.discriminator}, you already voted recently!: ${time.hours}hours ${time.minutes}minutes ${time.seconds}seconds`

            return res.redirect(`/bots/${botID}`)

 } else {

    botdb.votes += 1;
    botdb.save()
    db.ref(`Cowndown/Votes/${user.id}/${stringID}/Timer`).set(Date.now());

    await Bots.findOne({ _id: stringID }, async (err, dados) => {

      if(dados) {

client.channels.cache.get("779819680898088980").send(`<@!${user.id}> Votou no bot ${dados.name} com sucesso ! !`)
        
        res.redirect(`/bots/${botID}`)
      }

    })

  }
})



router.get("/analises", checkAuth, async (req, res) => {

  let user = req.session.user;

  if(!client.guilds.cache.get('779815064676073512').members.cache.get(user.id)) return res.send('You must be a Moderator to access.')
  if(!client.guilds.cache.get('779815064676073512').members.cache.get(user.id).roles.cache.has(('779820462498250753'))) return res.send('Access denied !')

  let filter = {};
  let analise = await Analises.find(filter);

    setTimeout(() => {

          res.render("analises.ejs", { user, Bots: analise, client });

    }, 2000)

});

router.get("/delete/:botID", checkAuth, async(req, res) => {

  let botID = req.params.botID
  let user  = req.session.user

  await Bots.findOne({ _id: botID }, async (err, dados) => {

        new Bots({
             _id: botID,
             name: dados.name,
             prefix: dados.prefix,
             invite: dados.invite,
             suporte: dados.suporte,
             owner: dados.owner,
             shortdescription: dados.shortdescription,
             description: dados.description,
             avatar: dados.avatar,
             livraria: dados.livraria
         }).delete()

client.channels.cache.get("779819631028076615").send(`<@!${botID}> de <@!${dados.owner}> foi deletado por <@!${user.id}> !`)

    let embed2 = new Discord.MessageEmbed()
.setDescription(`<@!${dados.owner} Seu bot <@!${botID}> foi deletado da Bots de Discord por <@!${user.id}>!`)

    res.redirect("/deletado")

    client.users.cache.get(dados.owner).send(embed2).catch(err => {

      let embed = new Discord.MessageEmbed().setDescription(`**|** Erro ao enviar mensagem para <@!${dados.owner}>\n\n\`\`\`js\n${err}\`\`\``)

      client.channels.cache.get('779819631028076615').send(embed)

    })

    client.guilds.cache.get('779815064676073512').members.cache.get(botID).kick({ reason: 'Bot reprovado !' })

  })

})

router.get("/aprovar/:botID", checkAuth, async(req, res) => {

  let botID = req.params.botID;
  let user  = req.session.user;

      await Analises.findOne({ _id: botID }, async (err, dados) => {

      new Bots({
          _id: botID,
          name: dados.name,
          prefix: dados.prefix,
          invite: dados.invite,
          suporte: dados.suporte,
          owner: dados.owner,
          dono: dados.dono,
          shortdescription: dados.shortdescription,
          avatar: dados.avatar,
      }).save()

      new Analises({
          _id: botID,
          name: dados.name,
          prefix: dados.prefix,
          invite: dados.invite,
          suporte: dados.suporte,
          owner: dados.owner,
          dono: dados.dono,
          shortdescription: dados.shortdescription,
          avatar: dados.avatar,
      }).delete()

          await Users.findByIdAndUpdate(dados.owner, { $push: { bots: botID } })


client.channels.cache.get("779819631028076615").send(`<@!${botID}> de <@!${dados.owner}> foi aprovado por <@!${user.id}> \n\ botsdediscord.glitch.me/discordbots/${dados.id}`)

          let embed2 = new Discord.MessageEmbed()
.setDescription(`<@!${dados.owner}> Seu bot <@!${botID}> foi aprovado na Bots de Discord por <@!${user.id}>!`)

          res.redirect("/analises")

          client.users.cache.get(dados.owner).send(embed2).catch(err => {

            let error = new Discord.MessageEmbed().setDescription(`**|** Erro ao enviar mensagem para <@!${dados.owner}>\n\n\`\`\`js\n${err}\`\`\``)

            client.channels.cache.get('779819631028076615').send(error)

          })
      })

})

router.get("/reprovar/:botID", checkAuth, async(req, res) => {

  let botID = req.params.botID
  let user  = req.session.user

  await Analises.findOne({ _id: botID }, async (err, dados) => {

        new Analises({
             _id: botID,
             name: dados.name,
             prefix: dados.prefix,
             invite: dados.invite,
             suporte: dados.suporte,
             owner: dados.owner,
             shortdescription: dados.shortdescription,
             description: dados.description,
             avatar: dados.avatar,
             livraria: dados.livraria
         }).delete()

client.channels.cache.get("779819631028076615").send(`<@!${botID}> de <@!${dados.owner}> foi reprovado <@!${user.id}> !`)

    let embed2 = new Discord.MessageEmbed()
.setDescription(`<@!${dados.owner} Seu bot <@!${botID}> foi reprovado na Bots de Discord por <@!${user.id}>!`)

    res.redirect("/analises")

    client.users.cache.get(dados.owner).send(embed2).catch(err => {

      let embed = new Discord.MessageEmbed().setDescription(`**|** Erro ao enviar mensagem para <@!${dados.owner}>\n\n\`\`\`js\n${err}\`\`\``)

      client.channels.cache.get('779819631028076615').send(embed)

    })

    client.guilds.cache.get('779815064676073512').members.cache.get(botID).kick({ reason: 'Bot reprovado !' })

  })

})

router.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }), 

function(req, res) {

    req.session.login    = true;
    req.session.user     = req.user;
    req.session.user.tag = `${req.user.username}#${req.user.discriminator}`
    req.session.guilds   = req.user.guilds;

    res.redirect("/");

});

function checkAuth(req, res, next) {

  if (req.session.login) return next();

  req.session.login = false;
  req.session.page = 1;
  res.redirect("/oauth2");

}

module.exports = router;