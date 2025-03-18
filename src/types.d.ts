interface ConfigMilestone {
  title: string
  repository: string
}

interface ConfigProject {
  title: string
  organization: string
}

interface ConfigIssueType {
  name: string
  repository: string
}

interface ConfigIssue {
  title: string
  repository: string
  id: string | undefined
  type: string | undefined
  description: string | undefined
  milestone: string | undefined
  project:
    | {
        title: string
      }
    | undefined
  labels: string[]
  assignees: string[]
  children: ConfigIssue[]
  github: GitHubIssue | undefined
}

interface ConfigVariables {
  name: string
  value: string
}

interface Config {
  issues: ConfigIssue[]
  config: {
    createMilestones: boolean
    variables: ConfigVariables[]
  }
}

interface GitHubRepo {
  full_name: string
  node_id: string
  organization: GitHubOrg
}

interface GitHubOrg {
  id: string
  node_id: string
  login: string
}

interface GitHubMilestone {
  repository: GitHubRepo
  title: string
  number: number
}

interface GitHubIssueType {
  repository: GitHubRepo
  id: string
  name: string
  isEnabled: boolean
}

interface GitHubProject {
  organization: GitHubOrg
  id: string
  title: string
}

interface GitHubIssue {
  node_id: string
  html_url: string
}
