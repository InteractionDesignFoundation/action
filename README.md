# GitHub Action for Deployer

```yaml
  - name: Deploy
    uses: interactiondesignfoundation/deployer-action@master
    with:
      private-key: ${{ secrets.PRIVATE_KEY }}
      known-hosts: ${{ secrets.KNOWN_HOSTS }}
      task: deploy prod -v
```

## Inputs

- `private-key` - Required. A private key to accessing servers.
- `known-hosts` - Optional. Host fingerprints. If omitted `StrictHostKeyChecking=no` will be used.
- `task` - Required. Arguments to pass to Deployer command.
- `path` - Optional. Paath to deployer binary.
- `version` - Optional. Deployer vesion number as it's specified at the https://deployer.org/download

## Deployer version

First, the action will check for Deployer bin at those paths:
- `vendor/bin/dep`
- `bin/dep`
- `deployer.phar`

If bin not found, phar version will be downloaded. 

## Example

```yaml
deploy:
  name: Deploy application
  runs-on: ubuntu-latest
  steps:
  - uses: actions/checkout@v1
  - name: Setup PHP
    uses: shivammathur/setup-php@master
    with:
      php-version: 8.1
  - name: Deploy
    uses: interactiondesignfoundation/deployer-action@master
    with:
      private-key: ${{ secrets.PRIVATE_KEY }}
      known-hosts: ${{ secrets.KNOWN_HOSTS }}
      task: deploy prod -v
      version: 7.0.0-rc.8
```
