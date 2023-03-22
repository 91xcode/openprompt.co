import * as dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import jsonToMDTable from 'json-to-markdown-table'

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const { data, error } = await supabase.from("prompts").select(`
	name,
	description,
	messages,
	handles!handles_prompt_id_fkey(
		handle
	),
	created_by:profiles!prompts_created_by_fkey(
		handles!handles_user_id_fkey(
			handle
		)
	),
	star_count:user-star-prompts(
		count
	),
	created_at
`);

const result = data
  .sort((a, b) => b.star_count[0].count - a.star_count[0].count)
	// .filter((prompt) => prompt.messages && prompt.messages[0])
  .slice(0, 30)
  .map((prompt) => {
    return {
      name: prompt.name,
      description: prompt.description,
      prompt:
        prompt.messages && prompt.messages[0]
          ? prompt.messages[0].content
          : null,
      handle: prompt.handles.handle,
      created_by: prompt.created_by.handles.handle,
      star_count: prompt.star_count[0].count,
    };
  });

writeFileSync("TopPrompts.json", JSON.stringify(result, null, 2));



// Generate README.md
const readme = `# Top Prompts

This is a list of the top prompts on [OpenPrompt.co](https://openprompt.co). The list is updated every 24 hours.

${jsonToMDTable(result, Object.keys(result[0]))}
`

writeFileSync("README.md", readme);
