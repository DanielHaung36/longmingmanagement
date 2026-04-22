import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: 'https://auth.easytool.page',
  realm: 'longi',
  clientId: 'longi-portal',   // public client in Keycloak
})

export default keycloak
