export const getOtherMember = (conversation, userId) =>
    conversation?.members?.find((member) => member._id !== userId)

export const getConversationTitle = (conversation, userId) => {
    if (!conversation) {
        return ''
    }

    if (conversation.type === 'group') {
        return conversation.name
    }

    return getOtherMember(conversation, userId)?.name || 'Direct conversation'
}

export const getConversationPreview = (conversation, userId) => {
    if (conversation.type === 'group') {
        return `${conversation.members?.length || 0} members`
    }

    return getOtherMember(conversation, userId)?.username
        ? `@${getOtherMember(conversation, userId).username}`
        : 'Direct conversation'
}