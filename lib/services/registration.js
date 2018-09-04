/**
 * Helper module to manage tasks related to user registration
 * Currently uses Gluu's SCIM API
 */

module.exports = function(config)
{
  const httpError = require('http-errors');

  return {
    // Token storage for this module
    // This will be reused and mutated in other methods of this module
    tokenSet: {},

    /**
     * Creates a user record with the SCIM server
     *
     * @param user User data with email and password keys
     * @return Promise which resolves user data or transparently rejects on an error
     */
     createUser: function(user)
     {
       const _this = this;
       return new Promise((resolve, reject) => {
         // Check if the tokenSet was initialized with a valid access_token
          if(!_this.tokenSet || !_this.tokenSet.access_token)
          {
            reject(httpError(500,
              'Something went wrong while creating the user',
              {info: {
                message: 'Uninitialized access token for registration service. Please initialize the service with a valid access token'
                     }
              }));
          }

          config.openIdClient.ensureAccessToken(_this.tokenSet)
            .then(tokenSet => {
              console.log(tokenSet);
              // Reset/mutate tokenSet based on the latest value
              _this.tokenSet = tokenSet;
            }).catch(error => reject(error));
        
          var userBody = {
            schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
            userName: user.email,
            emails: [{value: user.email, primary: true}],
            password: user.password,
            active: true
          };

          const axios = require('axios').create({
            baseURL: config.scim.baseURL,
            timeout: 10000,
            headers: {
              // Set Bearer token for SCIM access
              'Authorization': 'Bearer '+_this.tokenSet.access_token,
              'Content-type': 'application/scim+json'
            }
          });
 
          axios.post('/Users', userBody).then(response => resolve(response.data))
            .catch(error => reject(error));
        }); // Promise
       } // createUser
     } // return
} // module.exports