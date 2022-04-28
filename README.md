# GitHub Action for Deployer

Deploy your application using Deployer: a deployment tool written in PHP with support for popular frameworks out of the box.

```yaml
  - name: Deploy
    uses: interactiondesignfoundation/deployer-action@2
    with:
      private-key: ${{ secrets.PRIVATE_KEY }}
      task: deploy prod -v
```


## Inputs

- `private-key` - Required. A private key to accessing servers.
- `known-hosts` - Optional. Host fingerprints. If omitted `StrictHostKeyChecking=no` will be used.
- `task` - Required. Arguments to pass to Deployer command.
- `path` - Optional. Path to deployer binary.
- `version` - Optional. Deployer version number as it's specified at the https://deployer.org/download


## Deployer version

The priority of paths to look for a deployer binary is the following:
 1. path specified by `path` argument
 2. version specified by `version` argument
 3. System binary


## Workflow example

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
    uses: interactiondesignfoundation/deployer-action@2
    with:
      private-key: ${{ secrets.PRIVATE_KEY }}
      known-hosts: ${{ secrets.KNOWN_HOSTS }}
      task: deploy prod -v
      version: 7.0.0-rc.8
```
