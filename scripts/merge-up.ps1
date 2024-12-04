function Merge-Branches {
    param (
        [string]$sourceBranch,
        [string]$targetBranch,
        [string]$date
    )
 
    # Function to generate commit message with current date and time
    function Get-CommitMessage {
        return "Merging from $sourceBranch to $targetBranch $date"
    }
 
    git checkout $sourceBranch
    git pull
    git checkout $targetBranch
    git pull
    git merge $sourceBranch -m (Get-CommitMessage) --no-ff
    # resolve conflicts, if any
    git commit -m (Get-CommitMessage)
    git push --force
}
 
# Usage example:

$mergeDate = $(Get-Date -Format 'yyyy-MMM-dd HH:mm:ss')
$devBranch = 'dev'
$testBranch = 'test'
$prodBranch = 'release'
 

# DEV TO TEST
Merge-Branches -sourceBranch $devBranch -targetBranch $testBranch -date $mergeDate
 
# TEST TO PROD
Merge-Branches -sourceBranch $testBranch -targetBranch $prodBranch