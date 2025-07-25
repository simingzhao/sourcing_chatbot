# B2B Sourcing Chatbot Backend

  Please build a chatbot for B2B sourcing buyers to collect their sourcing requirements using the PocketFlow framework.

## Requirements

**Core Functionality:**

- Build a multimodal chatbot that helps B2B sourcing buyers communicate their sourcing needs
- Support conversation memory across interactions
- Use OpenAI Structured Output for consistent message formatting
- Implement intelligent requirement collection with adaptive questioning strategy

**Message Types:**

*User Input Types:*
1. Pure text messages
2. Text with image in message box
3. File uploads (TXT, CSV support)


*Chatbot Response Types:*
1. Pure text responses
2. Text with clickable text-pills beneath it
3. Text with structured card beneath it (markdown content + attachments if available)

**Chatbot Response Logic:**
1. **Requirement Assessment**: Determine if user requirements are broad (need refinement) or precise (minimal refinement needed)
2. **Progressive Information Collection**:
- Product specifications (adaptive based on requirement precision)
- Quantities
- Customization options (use text + clickable text-pills)
- Lead times
- Incoterms (EXW, FOB, DDP, CIF)
- Shipping logistics

3. **Requirement Summary**: When sufficient information is collected, provide summary card with:
- Bullet-point requirement summary
- Any user-attached files/images
- Structured markdown format
- Always have two clickable text-pills beneath the card, one is "Edit" and the other is "Submit"

4. **UX Interaction Flow:**
- Clicking a text-pill sends that pill's text as a user message
- "Edit" click triggers requirement modification flow:
- Bot asks which requirement to edit
- User specifies changes
- Bot re-summarizes with updated text + card format

**Technical Requirements:**
- Use OpenAI Structured Output for consistent message formatting
- Design prompts that follow the chatbot logic described above
- Output structured data that maps to UI message templates
- Implement conversation state management for memory


## Implementation Notes

This project requires careful prompt engineering to handle the adaptive questioning strategy and structured output formatting for different message types. Focus on creating a clear conversation flow that efficiently collects sourcing requirements while providing an intuitive user experience.