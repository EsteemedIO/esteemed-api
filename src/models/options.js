import qs from 'qs'
const { stringify } = qs
import { fetch as bhFetch } from 'bullhorn-auth'

export const options = {
  getTitles: async () => getOptions({ fields: 'customText3' }),
  getCMS: async () => getOptions({ fields: 'customText4' }),
  getLanguages: async () => getOptions({ fields: 'customText1' }),
  getAvailability: async () => getOptions({ fields: 'customText2' }),
  getCitizenshipStatus: async () => getOptions({ fields: 'customText5' }),
  getEnglishProficiency: async () => getOptions({ fields: 'customText6' }),
  getSkills: async () => {
    return bhFetch('options/Skill')
      .then(res => res.data.data)
      .catch(e => console.error(e))
  },
}

const getOptions = (params) => bhFetch('meta/Candidate?' + stringify(params))
  .then(res => res.data.fields[0].options)
  .catch(e => console.error(e))
