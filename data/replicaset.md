# First replica set
- Name: rs0
- Port: 27018
- Directory: data/R0S0

Launching server:
```shell script
mongod --replSet rs0 --port 27018 --dbpath data/R0S0
```
Launching client:
```shell script
mongo --port 27018
```
Inside mongo cli:
```javascript
rs.initiate ();
```

# Second replica set
- Name: rs1
- Port: 27019
- Directory: data/R0S1

Launching server:
```shell script
mongod --replSet rs0 --port 27019 --dbpath data/R0S1
```
Launching client:
```shell script
mongo --port 27019
```
Inside mongo cli:
```javascript
rs.initiate ();
```

# Third replica set
- Name: rs0
- Port: 27020
- Directory: data/R0S2

Launching server:
```shell script
mongod --replSet rs0 --port 27020 --dbpath data/R0S2
```
Launching client:
```shell script
mongo --port 27020
```
Inside mongo cli
```javascript
rs.initiate ();
```

# Link the last two replica sets to the primary at port 27018
```javascript
rs.add("localhost:27019");
rs.add("localhost:27020");
```

# Arbiter
- Directory: data/arb
- Port: 30000

Launch arbiter
```shell script
mongod --port 30000 --dbpath data/arb --replSet rs0
```

# Set the arbiter in the mongo cli at port 27018
```javascript
rs.addArb("localhost:30000")
```