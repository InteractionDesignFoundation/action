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

```yaml
  - name: Deploy
    uses: interactiondesignfoundation/deployer-action@2
    with:
      # Required. Private key for connecting to remote hosts. To generate private key:
      # `ssh-keygen -o -t rsa -C 'action@deployer.org'`.
      private-key: ${{ secrets.PRIVATE_KEY }}

      # Content of `~/.ssh/known_hosts` file. The public SSH keys for a
      # host may be obtained using the utility `ssh-keyscan`. 
      # For example: `ssh-keyscan deployer.org`.
      # If known-hosts omitted, `StrictHostKeyChecking no` will be added to
      # `ssh_config`.
      # Optional.
      known-hosts: ${{ secrets.KNOWN_HOSTS }}

      # Required. The deployer task to run.
      task: deploy production -v

      # You can specify path to your local Deployer binary in the repo.
      # Optional.
      bin-path: ./vendor/bin/deployer.phar

      # Deployer version number as it's specified at the https://deployer.org/download
      # Optional.
      version: 6.8.0
```


## Deployer version

The priority of paths to look for a deployer binary is the following:
 1. path specified by `bin-path` argument
 2. version specified by `version` argument
 3. System binary


## Workflow example

```yaml
name: deploy

on: push

# It is important to specify "concurrency" for the workflow,
# to prevent concurrency between different deploys.
concurrency: production_environment

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      deploy:
        name: Deploy application
        runs-on: ubuntu-latest
        steps:
        - uses: actions/checkout@v3

        - name: Setup PHP
          uses: shivammathur/setup-php@v2
          with:
            php-version: 8.1

        - name: Deploy
          uses: interactiondesignfoundation/deployer-action@2
          with:
            private-key: ${{ secrets.PRIVATE_KEY }}
            known-hosts: ${{ secrets.KNOWN_HOSTS }}
            task: deploy production -v
            version: 7.0.0-rc.8
```
