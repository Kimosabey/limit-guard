const forge = require('node-forge');
const fs = require('fs');

console.log('🔑 Generating 2048-bit key-pair...');
const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();

cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

const attrs = [{
    name: 'commonName',
    value: 'localhost'
}, {
    name: 'countryName',
    value: 'US'
}, {
    shortName: 'ST',
    value: 'Virginia'
}, {
    name: 'localityName',
    value: 'Blacksburg'
}, {
    name: 'organizationName',
    value: 'LimitGuard Inc'
}, {
    shortName: 'OU',
    value: 'Senior Engineering'
}];

cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.sign(keys.privateKey);

const pemKey = forge.pki.privateKeyToPem(keys.privateKey);
const pemCert = forge.pki.certificateToPem(cert);

fs.writeFileSync('server.key', pemKey);
fs.writeFileSync('server.cert', pemCert);

console.log('✅ SSL Certificates generated successfully using node-forge!');
