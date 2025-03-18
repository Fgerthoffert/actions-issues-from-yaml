import * as core from '@actions/core'
import * as github from '@actions/github'

import { getGitHubRepos } from './utils/getGitHubRepos.js'
import { loadActionConfig } from './utils/loadActionConfig.js'
import { configListRepos } from './utils/configListRepos.js'
import { configListMilestones } from './utils/configListMilestones.js'
import { configListIssueTypes } from './utils/configListIssueTypes.js'
import { configListProjects } from './utils/configListProjects.js'
import { createGitHubIssues } from './utils/createGitHubIssues.js'
import { updateGitHubIssuesDescriptions } from './utils/updateGitHubIssuesDescriptions.js'
import { getGitHubMilestones } from './utils/getGitHubMilestones.js'
import { getGitHubIssueTypes } from './utils/getGitHubIssueTypes.js'
import { getGitHubProjects } from './utils/getGitHubProjects.js'
import {
  areReposValid,
  areIssueTypesValid,
  areMilestonesValid,
  areProjectsValid
} from './utils/checkData.js'
import { addVariablesToIssues } from './utils/addVariablesToIssues.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */

// Scope required: ['read:project']

export async function run(): Promise<void> {
  try {
    const inputGithubToken = core.getInput('token')
    const inputYamlConfig = core.getInput('config')

    const octokit = github.getOctokit(inputGithubToken)
    const {
      data: { login }
    } = await octokit.rest.users.getAuthenticated()
    core.info(`Successfully authenticated to GitHub as: ${login}`)

    const config = loadActionConfig(inputYamlConfig)

    // Modify the issues with content from the variables
    const issues = addVariablesToIssues(config.issues, config.config.variables)
    console.log(issues)

    // Confirm all repos listed in the YAML file do exist
    // and are accessible by the provided user token
    const configRepos = configListRepos(issues)
    const gitHubRepos = await getGitHubRepos(configRepos)
    if (!areReposValid(configRepos, gitHubRepos)) {
      core.setFailed(`Missing repositories detected, aborted issue creation.`)
      return
    }

    // Confirm all issue types listed in the YAML file do exist
    // for the repository
    const configIssueTypes = configListIssueTypes(issues)
    const gitHubIssueTypes = await getGitHubIssueTypes(gitHubRepos)
    if (!areIssueTypesValid(configIssueTypes, gitHubIssueTypes)) {
      core.setFailed(`Missing repositories detected, aborted issue creation.`)
      return
    }

    // Confirm all milestones listed in the YAML file do exist
    // and are accessible by the provided user token. If the corresponding
    // config is provided, create the corresponding milestone in GitHub.
    const configMilestones = configListMilestones(issues)
    let gitHubMilestones = await getGitHubMilestones(gitHubRepos)
    if (
      !(await areMilestonesValid(
        configMilestones,
        gitHubMilestones,
        config.config.createMilestones
      ))
    ) {
      core.setFailed(`Missing milestones detected, aborted issue creation.`)
      return
    }

    // Fetch the list of milestones once more since some might have been created in the previous step
    core.info(
      `Refreshing the list of milestones in GitHub (some might have been created in the previous step)`
    )
    gitHubMilestones = await getGitHubMilestones(gitHubRepos)

    // Fetch the list of projects configured in the YAML file
    const configProjects = configListProjects(issues)
    const gitHubProjects = await getGitHubProjects(gitHubRepos)
    if (!areProjectsValid(configProjects, gitHubProjects)) {
      core.setFailed(`Missing repositories detected, aborted issue creation.`)
      return
    }

    const submittedIssues = await createGitHubIssues(
      issues,
      gitHubMilestones,
      gitHubIssueTypes,
      gitHubProjects
    )

    await updateGitHubIssuesDescriptions(submittedIssues)

    core.info('Action completed successfully')

    core.setOutput('issues', JSON.stringify(submittedIssues))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
