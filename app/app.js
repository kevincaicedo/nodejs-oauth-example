const passport = require("passport");
const GitLabStrategy = require("passport-gitlab2").Strategy;
const app = require("express")();
const axios = require("axios");

let mockUSer = null;

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new GitLabStrategy({
    clientID: "0f694e40a8b585a005a5cb55303ef6a99d9c2a1f53fc8e2ab753a9a1b276a5f6",
    clientSecret: "9120a8d9863c6188ffe34d71c19b11443d99dcc77f60a6af2863aa062b3c3b13",
    callbackURL: "http://localhost:3333/auth/gitlab/callback",
    baseURL: 'http://localhost:8888/', // change the base url for self-managed gitlab
    scope: ['api']
  },
  function(accessToken, refreshToken, profile, cb) {
    mockUSer = {
        accessToken, 
        refreshToken, 
        profile,
    }
    console.log(accessToken, refreshToken, profile)
    return cb(null, profile);
  }
));


app.get('/auth/gitlab', (req, res, next) => {
  console.log("From Keycloak", req.params, req.query);
  next()
}, passport.authenticate('gitlab'));

app.get('/auth/gitlab/callback',
  passport.authenticate('gitlab', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);

app.get('/oauth/recived', function(req, res) {
    console.log(req.params, req.body, req.user, req.query);
    req.send(req.query)
  }
);

app.set('view engine', 'pug')

app.get('/', (req, res) => {
    if(!mockUSer) return res.send("First you should sign in wiht you gitlab account")

    axios.get(`http://localhost:8888/api/v4/users/${mockUSer.profile.id}/projects?access_token=${mockUSer.accessToken}`)
        .then(response => {
            res.render('index', { user: mockUSer.profile, repos: response.data })
        }).catch(error => {
            res.send(`Something went wrong ${error}`)
            console.log(error);
        });
    
})
app.get('/login', (req, res) => res.send("Auth Failded"))
app.listen(3333, () => console.log("Listening..."))

// curl "https://gitlab.com/api/v4/user?access_token=00041debc7156e22bbd3f796733d3f235a6b7de75153ea05d232c75dbc563b7a" > response.json
