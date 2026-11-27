// Generated from one.tokens.json by generate_tokens.py.
package one.ui

import androidx.compose.animation.core.SpringSpec
import androidx.compose.animation.core.spring
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

data class OnePalette(
    val canvas: Color,
    val surface: Color,
    val surfaceSubtle: Color,
    val surfaceRaised: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textMuted: Color,
    val placeholder: Color,
    val borderSubtle: Color,
    val borderControl: Color,
    val borderStrong: Color,
    val borderHighContrast: Color,
    val action: Color,
    val actionHover: Color,
    val actionActive: Color,
    val onAction: Color,
    val accept: Color,
    val acceptHover: Color,
    val acceptActive: Color,
    val onAccept: Color,
    val decline: Color,
    val declineHover: Color,
    val declineActive: Color,
    val onDecline: Color,
    val destructive: Color,
    val destructiveHover: Color,
    val destructiveActive: Color,
    val onDestructive: Color,
    val neutral: Color,
    val neutralHover: Color,
    val neutralActive: Color,
    val onNeutral: Color,
    val selected: Color,
    val onSelected: Color,
    val focus: Color,
    val focusGap: Color,
    val disabledFill: Color,
    val disabledText: Color,
    val categoryBlue: Color,
    val categoryLavender: Color,
    val categoryGreen: Color,
    val onCategory: Color,
    val successText: Color,
    val successFill: Color,
    val warningText: Color,
    val warningFill: Color,
    val dangerText: Color,
    val dangerFill: Color,
    val infoText: Color,
    val infoFill: Color,
    val overlay: Color,
)

object OneTokens {
    val light = OnePalette(
        canvas = Color(0xFFFFFFFF),
        surface = Color(0xFFFFFFFF),
        surfaceSubtle = Color(0xFFF4F4F4),
        surfaceRaised = Color(0xFFEAEAEA),
        textPrimary = Color(0xFF000000),
        textSecondary = Color(0xFF595959),
        textMuted = Color(0xFF595959),
        placeholder = Color(0xFF595959),
        borderSubtle = Color(0xFFDEDEDE),
        borderControl = Color(0xFF828282),
        borderStrong = Color(0xFF595959),
        borderHighContrast = Color(0xFF000000),
        action = Color(0xFFDFD49A),
        actionHover = Color(0xFFE7DFAF),
        actionActive = Color(0xFFCFC184),
        onAction = Color(0xFF000000),
        accept = Color(0xFF3F7057),
        acceptHover = Color(0xFF4A7A62),
        acceptActive = Color(0xFF345E49),
        onAccept = Color(0xFFFFFFFF),
        decline = Color(0xFFD99090),
        declineHover = Color(0xFFE1A4A4),
        declineActive = Color(0xFFCB7F7F),
        onDecline = Color(0xFF000000),
        destructive = Color(0xFFAD4648),
        destructiveHover = Color(0xFFB94F51),
        destructiveActive = Color(0xFF983D40),
        onDestructive = Color(0xFFFFFFFF),
        neutral = Color(0xFFFFFFFF),
        neutralHover = Color(0xFFF4F4F4),
        neutralActive = Color(0xFFEAEAEA),
        onNeutral = Color(0xFF000000),
        selected = Color(0xFFFBF5CE),
        onSelected = Color(0xFF000000),
        focus = Color(0xFF000000),
        focusGap = Color(0xFFFFFFFF),
        disabledFill = Color(0xFFEAEAEA),
        disabledText = Color(0xFF595959),
        categoryBlue = Color(0xFF5AB8FF),
        categoryLavender = Color(0xFF9D8AFF),
        categoryGreen = Color(0xFF30B588),
        onCategory = Color(0xFF000000),
        successText = Color(0xFF166534),
        successFill = Color(0xFFF0FDF4),
        warningText = Color(0xFF854D0E),
        warningFill = Color(0xFFFFFBEA),
        dangerText = Color(0xFFB91C1C),
        dangerFill = Color(0xFFFFF1F2),
        infoText = Color(0xFF1D4ED8),
        infoFill = Color(0xFFEFF6FF),
        overlay = Color(0x73000000),
    )
    val dark = OnePalette(
        canvas = Color(0xFF000000),
        surface = Color(0xFF191919),
        surfaceSubtle = Color(0xFF191919),
        surfaceRaised = Color(0xFF212121),
        textPrimary = Color(0xFFFFFFFF),
        textSecondary = Color(0xFFC8C8C8),
        textMuted = Color(0xFF959595),
        placeholder = Color(0xFF959595),
        borderSubtle = Color(0xFF323232),
        borderControl = Color(0xFF828282),
        borderStrong = Color(0xFF959595),
        borderHighContrast = Color(0xFFFFFFFF),
        action = Color(0xFFDFD49A),
        actionHover = Color(0xFFE7DFAF),
        actionActive = Color(0xFFCFC184),
        onAction = Color(0xFF000000),
        accept = Color(0xFF3F7057),
        acceptHover = Color(0xFF4A7A62),
        acceptActive = Color(0xFF345E49),
        onAccept = Color(0xFFFFFFFF),
        decline = Color(0xFFD99090),
        declineHover = Color(0xFFE1A4A4),
        declineActive = Color(0xFFCB7F7F),
        onDecline = Color(0xFF000000),
        destructive = Color(0xFFAD4648),
        destructiveHover = Color(0xFFB94F51),
        destructiveActive = Color(0xFF983D40),
        onDestructive = Color(0xFFFFFFFF),
        neutral = Color(0xFF191919),
        neutralHover = Color(0xFF212121),
        neutralActive = Color(0xFF323232),
        onNeutral = Color(0xFFFFFFFF),
        selected = Color(0xFF464029),
        onSelected = Color(0xFFFFFFFF),
        focus = Color(0xFFDFD49A),
        focusGap = Color(0xFF000000),
        disabledFill = Color(0xFF212121),
        disabledText = Color(0xFFB8B8B8),
        categoryBlue = Color(0xFF5AB8FF),
        categoryLavender = Color(0xFF9D8AFF),
        categoryGreen = Color(0xFF30B588),
        onCategory = Color(0xFF000000),
        successText = Color(0xFF86EFAC),
        successFill = Color(0xFF143322),
        warningText = Color(0xFFFDE68A),
        warningFill = Color(0xFF332B12),
        dangerText = Color(0xFFFF6666),
        dangerFill = Color(0xFF3B1717),
        infoText = Color(0xFF93C5FD),
        infoFill = Color(0xFF17283B),
        overlay = Color(0x99000000),
    )
    private val lightDefault = light
    private val darkDefault = dark
    private val lightHighContrast = light.copy(
        textSecondary = Color(0xFF191919),
        textMuted = Color(0xFF222222),
        placeholder = Color(0xFF222222),
        borderSubtle = Color(0xFF555555),
        borderControl = Color(0xFF000000),
        borderStrong = Color(0xFF000000),
    )
    private val darkHighContrast = dark.copy(
        textSecondary = Color(0xFFFFFFFF),
        textMuted = Color(0xFFEEEEEE),
        placeholder = Color(0xFFEEEEEE),
        borderSubtle = Color(0xFFAAAAAA),
        borderControl = Color(0xFFFFFFFF),
        borderStrong = Color(0xFFFFFFFF),
        focus = Color(0xFFFFFFFF),
    )
    private val lightObsidianStudio = light.copy(
        surfaceSubtle = Color(0xFFF1F2F5),
        surfaceRaised = Color(0xFFE8EAF0),
        textSecondary = Color(0xFF414550),
        borderControl = Color(0xFF737680),
    )
    private val darkObsidianStudio = dark.copy(
        canvas = Color(0xFF0C0E13),
        surface = Color(0xFF171A22),
        surfaceSubtle = Color(0xFF191C24),
        surfaceRaised = Color(0xFF222632),
        textPrimary = Color(0xFFF5F6FA),
        borderControl = Color(0xFF898E9C),
    )
    private val lightPaperEditorial = light.copy(
        canvas = Color(0xFFFAF7EF),
        surface = Color(0xFFFFFDF8),
        surfaceSubtle = Color(0xFFF5F0E7),
        surfaceRaised = Color(0xFFEBE5D9),
        textPrimary = Color(0xFF29251F),
        textSecondary = Color(0xFF5D564A),
        borderControl = Color(0xFF776F61),
    )
    private val darkPaperEditorial = dark.copy(
        canvas = Color(0xFF161410),
        surface = Color(0xFF1C1915),
        surfaceSubtle = Color(0xFF211E19),
        surfaceRaised = Color(0xFF2B2720),
        textPrimary = Color(0xFFF8F2E5),
        borderControl = Color(0xFF928775),
    )

    @Composable
    fun colors(darkTheme: Boolean = isSystemInDarkTheme(), preset: String = "default"): OnePalette =
        when (preset) {
            "default" -> if (darkTheme) darkDefault else lightDefault
            "high-contrast" -> if (darkTheme) darkHighContrast else lightHighContrast
            "obsidian-studio" -> if (darkTheme) darkObsidianStudio else lightObsidianStudio
            "paper-editorial" -> if (darkTheme) darkPaperEditorial else lightPaperEditorial
            else -> if (darkTheme) dark else light
        }

    object Space {
        val zero = 0.dp
        val xxs = 4.dp
        val xs = 8.dp
        val sm = 12.dp
        val md = 16.dp
        val lg = 20.dp
        val xl = 24.dp
        val section = 32.dp
        val display = 40.dp
        val hero = 48.dp
        val page = 64.dp
    }
    object Radius {
        val small = 6.dp
        val control = 12.dp
        val workingPanel = 12.dp
        val readingDialog = 18.dp
        val categoryPanel = 24.dp
        val pill = 9999.dp
    }
}

object OneSprings {
    val snappy: SpringSpec<Float> = spring(dampingRatio = 0.78072006f, stiffness = 420.000000f)
    val tactile: SpringSpec<Float> = spring(dampingRatio = 0.63245553f, stiffness = 360.000000f)
    val elastic: SpringSpec<Float> = spring(dampingRatio = 0.57735027f, stiffness = 300.000000f)
    val gentle: SpringSpec<Float> = spring(dampingRatio = 0.87645982f, stiffness = 220.000000f)
    val detent: SpringSpec<Float> = spring(dampingRatio = 0.83320512f, stiffness = 520.000000f)
}
