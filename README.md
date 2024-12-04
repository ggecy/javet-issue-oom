# javet-issue-oom

1. import the maven project to your IDE, e.g. IntelliJ IDEA
2. run `npm install`
3. run `npm run watch` to build the bundle.cjs and watch for changes to TS sources
4. run the `Main.java`
5. wait until you start seeing downloaded counts, this may take up to 30 seconds
6. determine the java process PID, e.g. through Task Manager 
7. run `jmap -histo:all <PID> | less` periodically and check the count of V8ValueString objects in memory - this should be increasing each time you rerun the jmap 