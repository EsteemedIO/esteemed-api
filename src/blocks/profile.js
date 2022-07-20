import { options } from '../models/options.js'
import { createSlackOptions } from '../util/slackUtils.js'
import { default as cache } from '../util/cache.js'

export default async function() {
  const key =  '__express__/options'
  const cacheContent = cache.getKey(key)

  if (cacheContent) {
    return JSON.parse(cacheContent)
  }
  else {
    const form = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Please choose the role titles that best fit your background and experience.'
        },
        accessory: {
          type: 'multi_static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Titles'
          },
          action_id: 'titles',
          options: createSlackOptions(await options.getTitles())
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'What are some of your top skills? (Select up to 5)'
        },
        accessory: {
          type: 'multi_static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select skills'
          },
          action_id: 'skills',
          max_selected_items: 5,
          options: createSlackOptions(await options.getSkills())
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Which coding languages do you work with? Choose as many as you like.'
        },
        accessory: {
          type: 'multi_static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select items'
          },
          action_id: 'languages',
          options: createSlackOptions(await options.getLanguages())
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Which CMS products do you have experience with?'
        },
        accessory: {
          type: 'multi_static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select items'
          },
          action_id: 'cms',
          options: createSlackOptions(await options.getCMS())
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Enter the date you are available for at least part time hours'
        },
        accessory: {
          type: 'datepicker',
          action_id: 'date_available',
          placeholder: {
            type: 'plain_text',
            text: 'Select a date'
          }
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'How many hours per week are you available?'
        },
        accessory: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Availability'
          },
          action_id: 'availability',
          options: createSlackOptions(await options.getAvailability())
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Are you authorized to work full-time in the country you are applying?'
        },
        accessory: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Citizenship Status'
          },
          action_id: 'citizen',
          options: createSlackOptions(await options.getCitizenshipStatus())
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'English Proficiency'
        },
        accessory: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Choose your level'
          },
          action_id: 'english',
          options: createSlackOptions(await options.getEnglishProficiency())
        }
      }
    ]

    cache.setKey(key, JSON.stringify(form))

    return form
  }
}
