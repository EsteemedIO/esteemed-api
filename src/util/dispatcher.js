import * as commandProfile from '../slashCommands/profile'

export async function dispatch(event, context) {
  let message = JSON.parse(event.Records[0].Sns.Message)

  switch(message.function) {
    case 'create-resume':
      await commandProfile.createResume(message.params)
      break
  }
}
