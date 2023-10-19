# NodeBB - Connect VM deployment

For nodebb setup visit below link
Link: https://docs.nodebb.org/installing/os/ubuntu/
## Steps to setup NodeBB:
1. Server setup
2. Installing Node.js
3. Installing MongoDB
4. Configure MongoDB
5. Installing NodeBB
6. Access application

## 1. Server setup
- Os : ubuntu 20.0
- Ports: 22, 80, 4567, 27017
## 2. Installing Node.js
- Repo: https://deb.nodesource.com/
### node installation
- sudo apt-get update && sudo apt-get install -y ca-certificates curl gnupg
- curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
- NODE_MAJOR=20
- echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
- sudo apt-get install nodejs -y
- Node -v
- Node version should be above 12 if not follow the steps below
- Install node version manager (nvm) for installing node v:18
### install nvm:
- curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
- Restart the system by logout and login
- source ~/.bashrc
- nvm install 18
- nvm use 18 -----for setting node v.18 as default
- sudo apt install npm -y

## 3. Installing MongoDB
- wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add 
- echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
- sudo apt-get update
- sudo apt-get install -y mongodb-org

- mongod --version
- sudo systemctl start mongod
- Error: sudo systemctl daemon-reload
- sudo systemctl status mongod
- Sudo systemctl enable mongod

## 4. Configure MongoDB
### Enter into mongodb:
- mongo
    use admin
        db.createUser( { user: "admin", pwd: "password", roles: [ { role: "root", db: "admin" } ] } )
### now setup your nodebb database
        use nodebb
        db.createUser( { user: "nodebb", pwd: "amkamk3", roles: [ { role: "readWrite", db: "nodebb" }, { role: "clusterMonitor", db: "admin" } ] } )
        quit()

### Enable database authorization:
- sudo vi /etc/mongod.conf 
    security:
         authorization: enabled

### Restart MongoDB and verify:

- sudo systemctl restart mongod
- mongo -u admin -p password --authenticationDatabase=admin
- exit

## 5. Installing & Starting NodeBB
- mgit clone -b v3.x https://github.com/NodeBB/NodeBB.git nodebb
- cd nodebb
- ./nodebb setup
- Give data base credentials 
- Register user in it
- ./nodebb start

## 6. Access application
- Access application using ip-addr:4567
- Login with your credentials which are previously given
- You can register new one from console

## Commands history:
### Node installation:
    sudo apt-get update
    curl -sL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get update && sudo apt-get install -y ca-certificates curl gnupg
    sudo apt install nodejs -y
    Nvm (node version manager) installation:
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    logout
    sudo npm install npm -y
    sudo apt install npm -y
    npm -v
    node -v
    nvm use 18
    node -v
    npm -v
### Mongodb installation:
    wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    mongod --version
    sudo systemctl start mongod
    sudo systemctl status mongod
    Mongodb configuration:
    mongo
    sudo vi /etc/mongod.conf
    sudo systemctl restart mongod
    mongo -u admin -p password --authenticationDatabase=admin
### Nodebb installation:
    git clone -b v3.x https://github.com/NodeBB/NodeBB.git nodebb
    cd nodebb/
    ./nodebb setup
    ./nodebb start

