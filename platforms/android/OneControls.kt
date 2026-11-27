// SPDX-License-Identifier: AGPL-3.0-only
package one.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

enum class OneActionRole { Action, Accept, Decline, Destructive, Neutral }

@Composable
fun OneButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    role: OneActionRole = OneActionRole.Action,
    enabled: Boolean = true,
    loading: Boolean = false,
    compact: Boolean = false,
    leading: (@Composable () -> Unit)? = null,
) {
    val colors = OneTokens.colors()
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val hovered by interaction.collectIsHoveredAsState()
    val focused by interaction.collectIsFocusedAsState()
    val (rest, hover, active) = when (role) {
        OneActionRole.Action -> Triple(colors.action, colors.actionHover, colors.actionActive)
        OneActionRole.Accept -> Triple(colors.accept, colors.acceptHover, colors.acceptActive)
        OneActionRole.Decline -> Triple(colors.decline, colors.declineHover, colors.declineActive)
        OneActionRole.Destructive -> Triple(colors.destructive, colors.destructiveHover, colors.destructiveActive)
        OneActionRole.Neutral -> Triple(colors.neutral, colors.neutralHover, colors.neutralActive)
    }
    val ink = when (role) {
        OneActionRole.Action -> colors.onAction
        OneActionRole.Accept -> colors.onAccept
        OneActionRole.Decline -> colors.onDecline
        OneActionRole.Destructive -> colors.onDestructive
        OneActionRole.Neutral -> colors.onNeutral
    }
    val bordered = role == OneActionRole.Neutral || LocalOneActionBorderPolicy.current == OneActionBorderPolicy.Bordered
    val border = when {
        focused && enabled && !loading -> BorderStroke(2.dp, ink)
        bordered -> BorderStroke(1.dp, colors.borderStrong)
        else -> null
    }
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        interactionSource = interaction,
        modifier = modifier.sizeIn(minWidth = 48.dp, minHeight = 48.dp).semantics {
            if (loading) stateDescription = "Loading"
        },
        contentPadding = PaddingValues(vertical = if (compact) OneTokens.Space.xxs else OneTokens.Space.xs),
        shape = RoundedCornerShape(OneTokens.Radius.control),
        border = border,
        colors = ButtonDefaults.buttonColors(
            containerColor = when { pressed -> active; hovered -> hover; else -> rest },
            contentColor = ink,
            disabledContainerColor = if (loading) rest else colors.disabledFill,
            disabledContentColor = if (loading) ink else colors.disabledText,
        ),
    ) {
        Box {
            Row(
                Modifier.padding(horizontal = OneTokens.Space.lg),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (leading != null) {
                    leading()
                    Spacer(Modifier.width(OneTokens.Space.xs))
                }
                Text(label)
            }
            if (loading) {
                Box(
                    Modifier.align(Alignment.CenterStart).width(OneTokens.Space.lg).clearAndSetSemantics {},
                    contentAlignment = Alignment.Center,
                ) {
                    if (oneReducedMotion()) {
                        Text("…")
                    } else {
                        CircularProgressIndicator(
                            modifier = Modifier.size(OneTokens.Space.sm),
                            color = ink,
                            strokeWidth = 2.dp,
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun OneChoiceGroup(label: String, options: List<String>, selected: Int, onSelect: (Int) -> Unit, modifier: Modifier = Modifier) {
    val colors = OneTokens.colors()
    Column(modifier.selectableGroup().semantics { contentDescription = label }) {
        Text(label, color = colors.textPrimary)
        options.forEachIndexed { index, option ->
            Row(
                Modifier.fillMaxWidth().heightIn(min = 48.dp)
                    .selectable(selected == index, role = Role.RadioButton, onClick = { onSelect(index) }),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                RadioButton(selected == index, onClick = null,
                    colors = RadioButtonDefaults.colors(selectedColor = colors.accept, unselectedColor = colors.borderStrong))
                Spacer(Modifier.width(OneTokens.Space.xs))
                Text(option, color = colors.textPrimary)
            }
        }
    }
}

@Composable
fun OneField(label: String, value: String, onValueChange: (String) -> Unit, modifier: Modifier = Modifier,
             enabled: Boolean = true, error: String? = null) {
    val palette = OneTokens.colors()
    OutlinedTextField(
        value = value, onValueChange = onValueChange, modifier = modifier.heightIn(min = 48.dp),
        label = { Text(label) }, enabled = enabled, isError = error != null,
        supportingText = if (error == null) null else { { Text(error) } },
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = palette.textPrimary, unfocusedTextColor = palette.textPrimary,
            focusedBorderColor = palette.focus, unfocusedBorderColor = palette.borderControl,
            errorBorderColor = palette.dangerText, disabledTextColor = palette.disabledText,
            disabledContainerColor = palette.disabledFill, focusedContainerColor = palette.surface,
            unfocusedContainerColor = palette.surface,
        ),
    )
}

@Composable
fun OneBadge(label: String, modifier: Modifier = Modifier) {
    val palette = OneTokens.colors()
    Text(label, color = palette.infoText, modifier = modifier
        .background(palette.infoFill, RoundedCornerShape(OneTokens.Radius.pill))
        .padding(horizontal = OneTokens.Space.xs, vertical = OneTokens.Space.xxs))
}
