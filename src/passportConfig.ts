import * as passport from 'passport';
import * as passportLocal from 'passport-local';

import { MultiSamlStrategy } from 'passport-saml';
import User from './app/models/user.model';
import logger from './services/logger.service';
import middleware from './middlewares/middlewares';

const LocalStrategy = passportLocal.Strategy;

passport.serializeUser((user: any, done) => {
  logger.debug(
    `Passport.serializeUser ${JSON.stringify({
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email
    })}`
  );
  done(null, user);
});

passport.deserializeUser(async (user: any, done: any) => {
  logger.debug(
    `Passport.deserializeUser ${JSON.stringify({
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email
    })}`
  );
  try {
    done(null, user);
  } catch (e) {
    done(e);
  }
});

/**
 * Sign in using Email and Password.
 */
// passport.use(new LocalStrategy(User.authenticate()));
passport.use(
  'local',
  new LocalStrategy(
    { usernameField: 'username' },
    async (username, password, done) => {
      logger.info(
        `Passport.verify: ${JSON.stringify({
          username
        })}`
      );
      try {
        const checkUser = await User.findOne(
          {
            username: username.toLowerCase(),
            active: true
          },
          { _id: true, active: true, password: true }
        );
        if (
          checkUser &&
          checkUser.active &&
          (await checkUser.comparePassword(password))
        ) {
          logger.info(
            `Passport.verify: ${username} user authenticated successfully!.`
          );
          const { user } = await middleware.addUserToRequest(
            checkUser._id.toString()
          );
          done(undefined, user);
        } else {
          logger.error(
            `Passport.verify: ${username} password does not correspond to the user.`
          );
          done(undefined, false, {
            message: `${username} password does not correspond to the user..`
          });
        }
      } catch (e) {
        logger.error(
          `Passport.verify: oops an error occurred in your code!. URL made safe, user was sent at login!`
        );
        console.error(e);
      }
    }
  )
);

passport.use(
  'local-without-password',
  new LocalStrategy(
    { usernameField: 'username' },
    (username, password, done) => {
      console.log('passportLocal.verify()');
      User.findOne(
        {
          username: username.toLowerCase(),
          active: true
        },
        (err: any, user: any) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(undefined, false, {
              message: `username ${username} not found.`
            });
          }
          return done(undefined, user);
        }
      );
    }
  )
);

/**
 * Sign in using SAML
 */
const fetchSamlConfig = (request: any, done: any) => {
  console.log('fetchSamlConfig');
  const orgId = request.params.id;
  console.log('orgId', orgId);
  // cassandraClient.instance.TenantSSOConfig.findOne({ orgId }, (err, org) => {
  //   if (err) {
  //     return done(err);
  //   }
  // return done(null, JSON.parse(org.config));
  // });
  return done(null, {
    entryPoint:
      'https://osacontrolcom-dev.onelogin.com/trust/saml2/http-post/sso/6e86090a-7440-445b-9d8e-c38e6c74ac86',
    issuer: 'andes',
    authnContext: [
      'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport'
    ],
    callbackUrl: 'http://localhost:3030/sso/callback',
    cert:
      '-----BEGIN CERTIFICATE-----\n' +
      'MIIDzzCCAregAwIBAgIUZm9qQPacIWTsaLcw1Uij7w0e1S8wDQYJKoZIhvcNAQEF\n' +
      'BQAwQTEMMAoGA1UECgwDb3NhMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxGjAYBgNV\n' +
      'BAMMEU9uZUxvZ2luIEFjY291bnQgMB4XDTIyMDMwMjE5MzUyNVoXDTI3MDMwMjE5\n' +
      'MzUyNVowQTEMMAoGA1UECgwDb3NhMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxGjAY\n' +
      'BgNVBAMMEU9uZUxvZ2luIEFjY291bnQgMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A\n' +
      'MIIBCgKCAQEAr3WazRr0ziIBxFDBlCT4DpggRpHio1LMyo8Cyp4sCQg/tUoFOf8E\n' +
      '2EVEvS5r6XGLFUCvUINeywo5piFsguJllb000LwmnBVhCK/YYQWUSYtCzFVO6vne\n' +
      'umFt+ICRfMlYeIs+tE18jhKN4kGlOVlZY82KA6VgCgesZXveIJvbDlQu0P752MHt\n' +
      'r+TMliLTCZyu6rqHTyCY97/SatRbHRxP/0hOgZUnvOe1wRZeFiGVKAfcN9K6hU2+\n' +
      'MxEWf2T74Qo0Y5wLfmVzUSgTDFZnSrmLNauVJKN8WyjcPgvu0gA48GQSjLigAGd1\n' +
      'vUTcfe338kdvfUaMzaQR0CdbVwZd0WNZEwIDAQABo4G+MIG7MAwGA1UdEwEB/wQC\n' +
      'MAAwHQYDVR0OBBYEFN90/07kfa/61Dlc/999uDrvcbrdMHwGA1UdIwR1MHOAFN90\n' +
      '/07kfa/61Dlc/999uDrvcbrdoUWkQzBBMQwwCgYDVQQKDANvc2ExFTATBgNVBAsM\n' +
      'DE9uZUxvZ2luIElkUDEaMBgGA1UEAwwRT25lTG9naW4gQWNjb3VudCCCFGZvakD2\n' +
      'nCFk7Gi3MNVIo+8NHtUvMA4GA1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQUFAAOC\n' +
      'AQEAocMAk2Y7fSebAQrCvdY6BR/BgzNGu4PZ+1pg/mV5MpZDEQ+JVIaLFjyzCj0C\n' +
      'VylhUMDmLjSdQdqExsbjdILEEZNibwnlaJ+PWLCY44BpD49KtCydxLMiB5Bl2peE\n' +
      'WwftCq9LgIsNOXblPKD0pQWWHDUfFUbqEITOycZkTJ48k9Yy1tS2D4cFzhWT2N6E\n' +
      '22X4/e5gxmiOlj+1I7xfxJqLBcuMEjviu8LECOb0Q9rhdB3SWgsrb8UzjTQ8s3gp\n' +
      'AitVwFg4i7oEJ/PzslYgB4AiTkuhgmacCtlqaH91uzmsEqQlz2TjaEqLvJ//RIWR\n' +
      '26nKSm+1WEpNUWRvqCNfGilFfA==\n' +
      '-----END CERTIFICATE-----\n'
  });
};

passport.use(
  'multy-saml',
  new MultiSamlStrategy(
    {
      passReqToCallback: true, // makes req available in callback
      forceAuthn: true,
      getSamlOptions(request, done) {
        console.log('getSamlOptions');
        fetchSamlConfig(request, done);
      }
    },
    (req, profile, done) => {
      console.log('verify', profile);
      User.findOne(
        {
          username: profile?.nameID?.toLowerCase(),
          active: true
        },
        (err: any, user: any) => {
          if (err) {
            return done(err);
          }
          return done(null, user);
        }
      );
    }
  )
);

export { passport };
